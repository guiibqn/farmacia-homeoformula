import { distanciaChavesComPrefixo } from './busca.service';
import { gerarChaveFonetica } from './phonetic/metaphone-ptbr';

describe('distanciaChavesComPrefixo (desempate de pares LASA na busca híbrida)', () => {
  it('"Duxetina" (omissão) fica mais próxima de Duloxetina do que de Fluoxetina', () => {
    const chaveTermo = gerarChaveFonetica('Duxetina');
    const distDuloxetina = distanciaChavesComPrefixo(chaveTermo, gerarChaveFonetica('Duloxetina'));
    const distFluoxetina = distanciaChavesComPrefixo(chaveTermo, gerarChaveFonetica('Fluoxetina'));
    expect(distDuloxetina).toBeLessThan(distFluoxetina);
  });

  it('não penaliza o sufixo ausente em uma busca parcial com prefixo idêntico ("Predni")', () => {
    // "Predni" é prefixo exato tanto de Prednisolona quanto de Prednisona:
    // nenhuma das duas deve ser artificialmente favorecida por ser mais curta.
    const chaveTermo = gerarChaveFonetica('Predni');
    const distPrednisolona = distanciaChavesComPrefixo(chaveTermo, gerarChaveFonetica('Prednisolona'));
    const distPrednisona = distanciaChavesComPrefixo(chaveTermo, gerarChaveFonetica('Prednisona'));
    expect(distPrednisolona).toBe(distPrednisona);
  });
});
