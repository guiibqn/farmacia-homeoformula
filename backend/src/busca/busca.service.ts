import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { gerarChaveFonetica } from './phonetic/metaphone-ptbr';

export type ModoBusca = 'exata' | 'fonetica' | 'hibrida';

export interface ResultadoBusca {
  id: number;
  nome: string;
  principioAtivo: string;
}

const LIMIAR_SIMILARIDADE_TRIGRAMA = 0.2;

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
    const linhas = await this.prisma.$queryRaw<ResultadoBusca[]>`
      SELECT id, nome, "principio_ativo" AS "principioAtivo",
             word_similarity(${termo}, "principio_ativo") AS score
      FROM medicamentos
      WHERE word_similarity(${termo}, "principio_ativo") >= ${LIMIAR_SIMILARIDADE_TRIGRAMA}
      ORDER BY score DESC, id ASC;
    `;
    return linhas;
  }
}
