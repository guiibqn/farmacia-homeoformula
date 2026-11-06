import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProdutoTesteModule } from './produto-teste/produto-teste.module';
import { PrismaModule } from './prisma/prisma.module';
import { BuscaModule } from './busca/busca.module';

@Module({
  imports: [ProdutoTesteModule, PrismaModule, BuscaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
