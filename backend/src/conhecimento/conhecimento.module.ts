import { Module } from '@nestjs/common';
import { ConhecimentoService } from './conhecimento.service';
import { ConhecimentoController } from './conhecimento.controller';

@Module({ providers: [ConhecimentoService], controllers: [ConhecimentoController] })
export class ConhecimentoModule {}
