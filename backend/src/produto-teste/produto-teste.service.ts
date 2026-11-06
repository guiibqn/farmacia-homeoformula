import { Injectable } from '@nestjs/common';
import { CreateProdutoTesteDto } from './dto/create-produto-teste.dto';
import { UpdateProdutoTesteDto } from './dto/update-produto-teste.dto';
import { PrismaService } from '../prisma/prisma.service'; // Confirme se o caminho do PrismaService do Felipe é este

@Injectable()
export class ProdutoTesteService {
  // Injetando o Prisma no construtor
  constructor(private prisma: PrismaService) {}

  async create(createProdutoTesteDto: CreateProdutoTesteDto) {
    // Usando a variável para criar o registro no banco! (O erro vermelho some aqui)
    return await this.prisma.produtoTeste.create({
      data: {
        nome: createProdutoTesteDto.nome,
        preco: createProdutoTesteDto.preco,
        estoque: 10, // Valor de exemplo, já que o DTO original talvez não tenha
      },
    });
  }

  async findAll() {
    return await this.prisma.produtoTeste.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} produtoTeste`;
  }

  update(id: number, updateProdutoTesteDto: UpdateProdutoTesteDto) {
    // O erro vermelho do update sumiria se usássemos o Prisma aqui também
    return `This action updates a #${id} produtoTeste`;
  }

  remove(id: number) {
    return `This action removes a #${id} produtoTeste`;
  }
}
