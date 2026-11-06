/**
 * Gerador de chave fonética para nomes de medicamentos em português brasileiro.
 *
 * A proposta original (Entrega 1) previa o uso da biblioteca `metaphone-ptbr`.
 * Durante a implementação (Entrega 2), a instalação dessa dependência falhou
 * neste ambiente por exigir compilação nativa via node-gyp (ver registro no
 * capítulo de resultados). Optou-se por uma implementação própria, seguindo o
 * mesmo princípio descrito no referencial teórico (BONOTO, 2011): remover
 * vogais não iniciais e agrupar consoantes de som equivalente.
 *
 * Regras aplicadas, nesta ordem:
 * 1. Caixa alta, remoção de acentos e de caracteres não alfabéticos.
 * 2. Colapso de letras consecutivas repetidas (cobre erros de "Duplicação").
 * 3. Dígrafos e equivalências sonoras do português: PH->F, CH->X, LH->L, NH->N,
 *    QU(E|I)->K, C(E|I)->S, C(demais)->K, Ç->S, G(E|I)->J, X->S, Z->S, S->S.
 * 4. Remoção das vogais não iniciais (mantém a primeira letra da palavra,
 *    mesmo quando é vogal).
 * 5. Novo colapso de letras repetidas, caso a etapa 3 tenha criado pares.
 */
export function gerarChaveFonetica(textoOriginal: string): string {
  const semAcento = textoOriginal
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/Ç/g, 'S')
    .replace(/[^A-Z]/g, '');

  if (semAcento.length === 0) {
    return '';
  }

  const colapsado = colapsarRepetidas(semAcento);
  const foneticamenteMapeado = aplicarEquivalenciasSonoras(colapsado);
  const semVogaisInternas = removerVogaisNaoIniciais(foneticamenteMapeado);

  return colapsarRepetidas(semVogaisInternas);
}

function colapsarRepetidas(texto: string): string {
  let resultado = '';
  for (const letra of texto) {
    if (resultado[resultado.length - 1] !== letra) {
      resultado += letra;
    }
  }
  return resultado;
}

const VOGAIS = new Set(['A', 'E', 'I', 'O', 'U']);

function aplicarEquivalenciasSonoras(texto: string): string {
  let resultado = '';
  let i = 0;
  while (i < texto.length) {
    const atual = texto[i];
    const proxima = texto[i + 1];

    if (atual === 'P' && proxima === 'H') {
      resultado += 'F';
      i += 2;
      continue;
    }
    if (atual === 'C' && proxima === 'H') {
      resultado += 'X';
      i += 2;
      continue;
    }
    if (atual === 'L' && proxima === 'H') {
      resultado += 'L';
      i += 2;
      continue;
    }
    if (atual === 'N' && proxima === 'H') {
      resultado += 'N';
      i += 2;
      continue;
    }
    if (atual === 'Q' && proxima === 'U') {
      resultado += 'K';
      i += 2;
      continue;
    }
    if (atual === 'C' && (proxima === 'E' || proxima === 'I')) {
      resultado += 'S';
      i += 1;
      continue;
    }
    if (atual === 'C') {
      resultado += 'K';
      i += 1;
      continue;
    }
    if (atual === 'G' && (proxima === 'E' || proxima === 'I')) {
      resultado += 'J';
      i += 1;
      continue;
    }
    if (atual === 'X' || atual === 'Z') {
      resultado += 'S';
      i += 1;
      continue;
    }
    if (atual === 'H') {
      // "h" isolado é mudo em português.
      i += 1;
      continue;
    }

    resultado += atual;
    i += 1;
  }
  return resultado;
}

function removerVogaisNaoIniciais(texto: string): string {
  if (texto.length === 0) {
    return texto;
  }
  let resultado = texto[0];
  for (let i = 1; i < texto.length; i++) {
    const letra = texto[i];
    if (!VOGAIS.has(letra)) {
      resultado += letra;
    }
  }
  return resultado;
}
