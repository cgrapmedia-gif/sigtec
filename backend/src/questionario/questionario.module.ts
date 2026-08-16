import { Module } from '@nestjs/common';
import { QuestionarioController } from './questionario.controller';

@Module({ controllers: [QuestionarioController] })
export class QuestionarioModule {}
