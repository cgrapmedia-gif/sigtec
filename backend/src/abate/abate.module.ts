import { Module } from '@nestjs/common';
import { PdfModule } from '../pdf/pdf.module';
import { AbateService } from './abate.service';
import { AbateController } from './abate.controller';

@Module({ imports: [PdfModule], providers: [AbateService], controllers: [AbateController] })
export class AbateModule {}
