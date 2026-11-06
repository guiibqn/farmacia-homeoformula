import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { gerarChaveFonetica } from './phonetic/metaphone-ptbr';
import { distanciaLevenshtein } from './phonetic/levenshtein';

export type ModoBusca = 'exata' | 'fonetica' | 'hibrida';

export interface ResultadoBusca {
  id: number;
  nome: string;
  principioAtivo: string;
}

interface CandidatoHibrido extends ResultadoBusca {
  score: number;
}

const LIMIAR_SIMILARIDADE_TRIGRAMA = 0.2;

// Candidatos cujo escore de similaridade fica a até esta margem do melhor
// escore são considerados "empatados" para fins de desempate fonético.
const MARGEM_EMPATE_SIMILARIDADE = 0.05;

// Abaixo desta proporção entre o tamanho da chave mais curta e da mais longa,
// a consulta é tratada como uma provável busca parcial (prefixo truncado) na
// comparação de desempate: o trecho que falta não é penalizado, só o trecho
// em comum é comparado. Sem isso, uma chave curta pareceria sistematicamente
// "mais próxima" de candidatos com nomes mais curtos, mesmo quando o prefixo
// em comum é idêntico para todos os candidatos empatados.
const PROPORCAO_MINIMA_COMPARACAO_INTEGRAL = 0.7;

export function distanciaChavesComPrefixo(chaveTermo: string, chaveCandidato: string): number {
  const [curta, longa] =
    chaveTermo.length <= chaveCandidato.length
      ? [chaveTermo, chaveCandidato]
      : [chaveCandidato, chaveTermo];

  if (longa.length === 0) {
    return 0;
  }

  const proporcao = curta.length / longa.length;
  if (proporcao < PROPORCAO_MINIMA_COMPARACAO_INTEGRAL) {
    return distanciaLevenshtein(curta, longa.slice(0, curta.length));
  }
  return distanciaLevenshtein(chaveTermo, chaveCandidato);
}

@Injectable()
export class BuscaService {
  constructor(private readonly prisma: PrismaService) {}

  async buscar(termo: string, modo: ModoBusca): Promise<ResultadoBusca[]> {
    const termoLimpo = termo.trim();
    if (termoLimpo.length === 0) {
      return [];
    }

    switch (modo) {
      case 'exata':
        return this.buscarExata(termoLimpo);
      case 'fonetica':
        return this.buscarFonetica(termoLimpo);
      case 'hibrida':
        return this.buscarHibrida(termoLimpo);
    }
  }

  /** Linha de base: correspondência exata por substring (equivalente a ILIKE). */
  private async buscarExata(termo: string): Promise<ResultadoBusca[]> {
    const linhas = await this.prisma.$queryRaw<ResultadoBusca[]>`
      SELECT id, nome, "principio_ativo" AS "principioAtivo"
      FROM medicamentos
      WHERE unaccent(lower(nome)) ILIKE unaccent(lower('%' || ${termo} || '%'))
         OR unaccent(lower("principio_ativo")) ILIKE unaccent(lower('%' || ${termo} || '%'))
      ORDER BY id;
    `;
    return linhas;
  }

  /** Busca fonética isolada: igualdade exata de chave fonética. */
  private async buscarFonetica(termo: string): Promise<ResultadoBusca[]> {
    const chave = gerarChaveFonetica(termo);
    if (chave.length === 0) {
      return [];
    }
    const linhas = await this.prisma.$queryRaw<ResultadoBusca[]>`
      SELECT id, nome, "principio_ativo" AS "principioAtivo"
      FROM medicamentos
      WHERE "chave_fonetica" = ${chave}
      ORDER BY id;
    `;
    return linhas;
  }

  /**
   * Abordagem híbrida: tenta a busca fonética primeiro; se não houver
   * resultado, recorre à similaridade de trigramas (pg_trgm) contra o
   * princípio ativo, cobrindo erros que alteram a estrutura da palavra
   * (omissão, transposição, busca parcial).
   */
  private async buscarHibrida(termo: string): Promise<ResultadoBusca[]> {
    const porFonetica = await this.buscarFonetica(termo);
    if (porFonetica.length > 0) {
      return porFonetica;
    }

    // word_similarity compara o termo digitado com a melhor substring de
    // tamanho equivalente dentro do princípio ativo, o que o torna adequado
    // tanto para erros internos (omissão, transposição) quanto para buscas
    // parciais (ex.: "Amoxi" dentro de "Amoxicilina").
    const candidatos = await this.prisma.$queryRaw<CandidatoHibrido[]>`
      SELECT id, nome, "principio_ativo" AS "principioAtivo",
             word_similarity(${termo}, "principio_ativo") AS score
      FROM medicamentos
      WHERE word_similarity(${termo}, "principio_ativo") >= ${LIMIAR_SIMILARIDADE_TRIGRAMA}
      ORDER BY score DESC, id ASC;
    `;

    return this.desempatarPorChaveFonetica(termo, candidatos);
  }

  /**
   * A similaridade de trigramas, por si só, não "sabe" que dois princípios
   * ativos são foneticamente/visualmente confundíveis (par LASA) — ela só
   * mede sobreposição textual. Quando o melhor escore está empatado (dentro
   * de MARGEM_EMPATE_SIMILARIDADE) entre princípios ativos diferentes, esse
   * desempate usa a distância de edição entre a chave fonética do termo
   * digitado e a chave fonética de cada candidato empatado como critério
   * secundário, em vez de deixar a ordem cair em um critério arbitrário
   * (como o id). Isso reduz o risco de um medicamento de nome semelhante
   * aparecer em primeiro lugar no lugar do correto (critério "Falso
   * positivo LASA" da Tabela 2).
   */
  private desempatarPorChaveFonetica(
    termo: string,
    candidatos: CandidatoHibrido[],
  ): ResultadoBusca[] {
    if (candidatos.length === 0) {
      return [];
    }

    const melhorEscore = candidatos[0].score;
    const porPrincipioAtivo = new Map<string, CandidatoHibrido[]>();
    for (const candidato of candidatos) {
      const grupo = porPrincipioAtivo.get(candidato.principioAtivo) ?? [];
      grupo.push(candidato);
      porPrincipioAtivo.set(candidato.principioAtivo, grupo);
    }

    const grupos = [...porPrincipioAtivo.entries()].map(([principioAtivo, linhas]) => ({
      principioAtivo,
      linhas,
      escoreMaximo: Math.max(...linhas.map((l) => l.score)),
    }));

    const grupoDoMelhor = grupos.filter(
      (g) => melhorEscore - g.escoreMaximo <= MARGEM_EMPATE_SIMILARIDADE,
    );
    const demaisGrupos = grupos.filter((g) => !grupoDoMelhor.includes(g));

    if (grupoDoMelhor.length > 1) {
      const chaveTermo = gerarChaveFonetica(termo);
      grupoDoMelhor.sort((a, b) => {
        const distA = distanciaChavesComPrefixo(chaveTermo, gerarChaveFonetica(a.principioAtivo));
        const distB = distanciaChavesComPrefixo(chaveTermo, gerarChaveFonetica(b.principioAtivo));
        if (distA !== distB) return distA - distB;
        if (a.escoreMaximo !== b.escoreMaximo) return b.escoreMaximo - a.escoreMaximo;
        return a.principioAtivo.localeCompare(b.principioAtivo);
      });
    }

    return [...grupoDoMelhor, ...demaisGrupos].flatMap((g) =>
      g.linhas.map(({ id, nome, principioAtivo }) => ({ id, nome, principioAtivo })),
    );
  }
}
