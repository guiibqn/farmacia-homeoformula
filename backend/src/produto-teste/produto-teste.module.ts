import { Module } from '@nestjs/common';
import { ProdutoTesteService } from './produto-teste.service';
import { ProdutoTesteController } from './produto-teste.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importar no topo

@Module({
  imports: [PrismaModule], // Adicionar no array de imports
  controllers: [ProdutoTesteController],
  providers: [ProdutoTesteService],
})
export class ProdutoTesteModule {}
