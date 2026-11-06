import { PartialType } from '@nestjs/mapped-types';
import { CreateProdutoTesteDto } from './create-produto-teste.dto';

export class UpdateProdutoTesteDto extends PartialType(CreateProdutoTesteDto) {}
