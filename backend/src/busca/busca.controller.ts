import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { BuscaService, ModoBusca } from './busca.service';

const MODOS_VALIDOS: ModoBusca[] = ['exata', 'fonetica', 'hibrida'];

@Controller('medicamentos')
export class BuscaController {
  constructor(private readonly buscaService: BuscaService) {}

  @Get('busca')
  async buscar(@Query('termo') termo?: string, @Query('modo') modo?: string) {
    if (!termo || termo.trim().length === 0) {
      throw new BadRequestException('Parâmetro "termo" é obrigatório.');
    }
    const modoEscolhido = (modo ?? 'hibrida') as ModoBusca;
    if (!MODOS_VALIDOS.includes(modoEscolhido)) {
      throw new BadRequestException(
        `Parâmetro "modo" inválido. Use um de: ${MODOS_VALIDOS.join(', ')}.`,
      );
    }

    return this.buscaService.buscar(termo, modoEscolhido);
  }
}
