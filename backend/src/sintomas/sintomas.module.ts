import { Module } from '@nestjs/common';
import { SintomasService } from './sintomas.service';
import { SintomasController } from './sintomas.controller';

@Module({ providers: [SintomasService], controllers: [SintomasController] })
export class SintomasModule {}
