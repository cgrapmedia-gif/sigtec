import { Module } from '@nestjs/common';
import { DepartamentosService } from './departamentos.service';
import { DepartamentosController } from './departamentos.controller';

@Module({ providers: [DepartamentosService], controllers: [DepartamentosController] })
export class DepartamentosModule {}
