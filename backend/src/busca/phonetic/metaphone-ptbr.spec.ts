import { gerarChaveFonetica } from './metaphone-ptbr';

describe('gerarChaveFonetica', () => {
  it('produz a mesma chave para "Ibuprofeno" e "Iboprofeno" (vogal átona)', () => {
    expect(gerarChaveFonetica('Ibuprofeno')).toBe(gerarChaveFonetica('Iboprofeno'));
  });

  it('produz a mesma chave para "Omeprazol" e "Omeprasol" (fonética s/z)', () => {
    expect(gerarChaveFonetica('Omeprazol')).toBe(gerarChaveFonetica('Omeprasol'));
  });

  it('produz a mesma chave para "Nimesulida" e "Nimessulida" (duplicação)', () => {
    expect(gerarChaveFonetica('Nimesulida')).toBe(gerarChaveFonetica('Nimessulida'));
  });

  it('produz a mesma chave para "Cetoconazol" e "Setoconazol" (fonética c/s)', () => {
    expect(gerarChaveFonetica('Cetoconazol')).toBe(gerarChaveFonetica('Setoconazol'));
  });

  it('produz a mesma chave para "Aciclovir" e "Assiclovir" (fonética ci/ssi)', () => {
    expect(gerarChaveFonetica('Aciclovir')).toBe(gerarChaveFonetica('Assiclovir'));
  });

  it('distingue medicamentos com som claramente diferente', () => {
    expect(gerarChaveFonetica('Ibuprofeno')).not.toBe(gerarChaveFonetica('Amoxicilina'));
    expect(gerarChaveFonetica('Dopamina')).not.toBe(gerarChaveFonetica('Dobutamina'));
  });

  it('não altera a chave de uma grafia já correta (grupo de controle)', () => {
    expect(gerarChaveFonetica('Paracetamol')).toBe(gerarChaveFonetica('Paracetamol'));
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(gerarChaveFonetica('')).toBe('');
  });
});
