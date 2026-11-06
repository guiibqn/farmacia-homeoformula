import { distanciaLevenshtein } from './levenshtein';

describe('distanciaLevenshtein', () => {
  it('retorna 0 para strings iguais', () => {
    expect(distanciaLevenshtein('DSTN', 'DSTN')).toBe(0);
  });

  it('conta uma inserção', () => {
    expect(distanciaLevenshtein('DSTN', 'DLSTN')).toBe(1);
  });

  it('conta substituições e diferenças de tamanho', () => {
    expect(distanciaLevenshtein('gato', 'pato')).toBe(1);
    expect(distanciaLevenshtein('', 'abc')).toBe(3);
  });

  it('reconhece "DSTN" (Duxetina) mais próxima de "DLSTN" (Duloxetina) do que de "FLSTN" (Fluoxetina)', () => {
    const distDuloxetina = distanciaLevenshtein('DSTN', 'DLSTN');
    const distFluoxetina = distanciaLevenshtein('DSTN', 'FLSTN');
    expect(distDuloxetina).toBeLessThan(distFluoxetina);
  });
});
