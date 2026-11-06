/** Distância de edição clássica (inserção, remoção, substituição). */
export function distanciaLevenshtein(a: string, b: string): number {
  const linhas = a.length + 1;
  const colunas = b.length + 1;
  const matriz: number[][] = Array.from({ length: linhas }, () => new Array<number>(colunas).fill(0));

  for (let i = 0; i < linhas; i++) matriz[i][0] = i;
  for (let j = 0; j < colunas; j++) matriz[0][j] = j;

  for (let i = 1; i < linhas; i++) {
    for (let j = 1; j < colunas; j++) {
      const custoSubstituicao = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1, // remoção
        matriz[i][j - 1] + 1, // inserção
        matriz[i - 1][j - 1] + custoSubstituicao, // substituição
      );
    }
  }

  return matriz[linhas - 1][colunas - 1];
}
