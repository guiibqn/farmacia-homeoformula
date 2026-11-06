import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BuscaController } from './busca.controller';
import { BuscaService } from './busca.service';

@Module({
  imports: [PrismaModule],
  controllers: [BuscaController],
  providers: [BuscaService],
})
export class BuscaModule {}
