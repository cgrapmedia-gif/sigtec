import { Module } from '@nestjs/common';
import { PdfModule } from '../pdf/pdf.module';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';

@Module({ imports: [PdfModule], providers: [RelatoriosService], controllers: [RelatoriosController] })
export class RelatoriosModule {}
