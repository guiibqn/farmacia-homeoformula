import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProdutoTesteService } from './produto-teste.service';
import { CreateProdutoTesteDto } from './dto/create-produto-teste.dto';
import { UpdateProdutoTesteDto } from './dto/update-produto-teste.dto';

@Controller('produto-teste')
export class ProdutoTesteController {
  constructor(private readonly produtoTesteService: ProdutoTesteService) {}

  @Post()
  create(@Body() createProdutoTesteDto: CreateProdutoTesteDto) {
    return this.produtoTesteService.create(createProdutoTesteDto);
  }

  @Get()
  findAll() {
    return this.produtoTesteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produtoTesteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProdutoTesteDto: UpdateProdutoTesteDto) {
    return this.produtoTesteService.update(+id, updateProdutoTesteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.produtoTesteService.remove(+id);
  }
}
