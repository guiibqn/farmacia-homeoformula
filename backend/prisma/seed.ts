import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { gerarChaveFonetica } from '../src/busca/phonetic/metaphone-ptbr';

interface ItemCatalogo {
  id: number;
  nome: string;
  principio_ativo: string;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent;');

  const caminhoCatalogo = join(process.cwd(), 'test', 'data', 'catalogo.json');
  const catalogo: ItemCatalogo[] = JSON.parse(readFileSync(caminhoCatalogo, 'utf-8'));

  await prisma.medicamento.deleteMany();

  for (const item of catalogo) {
    await prisma.medicamento.create({
      data: {
        id: item.id,
        nome: item.nome,
        principioAtivo: item.principio_ativo,
        chaveFonetica: gerarChaveFonetica(item.principio_ativo),
      },
    });
  }

  console.log(`Seed concluído: ${catalogo.length} medicamentos inseridos.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
