import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  /** Gera o Auto de Abate oficial (RF-ABT-04) e devolve um Buffer */
  gerarAutoAbate(auto: {
    numero: string;
    data: Date;
    aprovadoPor: string;
    parecerPor: string;
    motivo: string;
    parecer: string;
    destino: string;
    sanitizacao: string;
    activos: { numInventario: string; descricao: string; numSerie: string | null; dataAquisicao: Date }[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 55, right: 55 } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (d: Date) => new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Cabecalho institucional
      doc.font('Helvetica-Bold').fontSize(11).text('REPÚBLICA DE ANGOLA', { align: 'center' });
      doc.fontSize(12).text('Consulado Geral de Angola no Porto', { align: 'center' });
      doc.font('Helvetica').fontSize(8.5).fillColor('#444444')
        .text('SERVIÇO DE INFORMÁTICA — GESTÃO DE PATRIMÓNIO TECNOLÓGICO', { align: 'center' });
      doc.moveDown(0.6);
      // Faixa vermelho/dourado
      const y0 = doc.y;
      doc.rect(55, y0, 242, 3).fill('#B5121B');
      doc.rect(297, y0, 243, 3).fill('#B8860B');
      doc.moveDown(1.4);

      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(15).text('AUTO DE ABATE DE BENS', { align: 'center' });
      doc.font('Helvetica').fontSize(10).text(`N.º ${auto.numero}  ·  ${fmt(auto.data)}`, { align: 'center' });
      doc.moveDown(1.2);

      doc.fontSize(10).text(
        `Aos ${new Date(auto.data).getDate()} dias do mês de ${new Date(auto.data).toLocaleDateString('pt-PT', { month: 'long' })} de ${new Date(auto.data).getFullYear()}, ` +
        'procedeu-se ao abate dos bens tecnológicos abaixo identificados, nos termos do procedimento interno de gestão patrimonial, ' +
        'com fundamento na análise de obsolescência registada no sistema SIGTEC.',
        { align: 'justify', lineGap: 2 },
      );
      doc.moveDown(0.8);

      // Tabela de bens
      const col = [55, 165, 355, 465, 540];
      const th = doc.y;
      doc.rect(col[0], th, col[4] - col[0], 18).fill('#F0EDE5');
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5);
      doc.text('N.º INVENTÁRIO', col[0] + 5, th + 5, { width: col[1] - col[0] - 10 });
      doc.text('DESCRIÇÃO', col[1] + 5, th + 5, { width: col[2] - col[1] - 10 });
      doc.text('N.º SÉRIE', col[2] + 5, th + 5, { width: col[3] - col[2] - 10 });
      doc.text('AQUISIÇÃO', col[3] + 5, th + 5, { width: col[4] - col[3] - 10 });
      let y = th + 18;
      doc.font('Helvetica').fontSize(9);
      for (const a of auto.activos) {
        const alturaLinha = 20;
        doc.rect(col[0], y, col[4] - col[0], alturaLinha).stroke('#999999');
        doc.text(a.numInventario, col[0] + 5, y + 6, { width: col[1] - col[0] - 10 });
        doc.text(a.descricao, col[1] + 5, y + 6, { width: col[2] - col[1] - 10 });
        doc.text(a.numSerie ?? '—', col[2] + 5, y + 6, { width: col[3] - col[2] - 10 });
        doc.text(fmt(a.dataAquisicao), col[3] + 5, y + 6, { width: col[4] - col[3] - 10 });
        y += alturaLinha;
      }
      doc.rect(col[0], th, col[4] - col[0], y - th).stroke('#666666');
      doc.x = 55; doc.y = y + 14;

      const campo = (rotulo: string, valor: string) => {
        doc.font('Helvetica-Bold').fontSize(10).text(`${rotulo}: `, { continued: true });
        doc.font('Helvetica').text(valor, { align: 'justify', lineGap: 2 });
        doc.moveDown(0.4);
      };
      campo('Motivo do abate', auto.motivo);
      campo('Parecer técnico', `${auto.parecer} (${auto.parecerPor})`);
      campo('Destino dos bens', auto.destino);
      campo('Sanitização de dados', auto.sanitizacao);

      doc.moveDown(0.4);
      doc.fontSize(8).fillColor('#555555').text(
        'Os registos completos destes equipamentos permanecem arquivados no sistema SIGTEC para efeitos de auditoria patrimonial. ' +
        'Documento gerado electronicamente — preparado para assinatura electrónica qualificada.',
        { align: 'justify' },
      );

      // Assinaturas
      doc.moveDown(3);
      const ya = doc.y;
      doc.fillColor('#000000').fontSize(9.5).font('Helvetica');
      doc.text('O Responsável Técnico', 70, ya, { width: 190, align: 'center' });
      doc.text('A Direcção', 335, ya, { width: 190, align: 'center' });
      doc.moveTo(70, ya + 50).lineTo(260, ya + 50).stroke('#000000');
      doc.moveTo(335, ya + 50).lineTo(525, ya + 50).stroke('#000000');
      doc.text(auto.parecerPor, 70, ya + 55, { width: 190, align: 'center' });
      doc.text(auto.aprovadoPor, 335, ya + 55, { width: 190, align: 'center' });

      doc.end();
    });
  }
}
