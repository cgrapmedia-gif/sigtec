import { Module } from '@nestjs/common';
import { ResolucoesService } from './resolucoes.service';
import { ResolucoesController } from './resolucoes.controller';

@Module({ providers: [ResolucoesService], controllers: [ResolucoesController] })
export class ResolucoesModule {}
