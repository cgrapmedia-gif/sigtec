import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { EMBLEMA_JPG, MORADA, RODAPE_JPG } from './folha-timbrada';

/** Margens que reservam espaço para o cabeçalho e o rodapé da folha timbrada */
const MARGENS = { top: 150, bottom: 105, left: 62, right: 62 };
const LARGURA_PAGINA = 595.28;
const LARGURA_UTIL = LARGURA_PAGINA - MARGENS.left - MARGENS.right;

@Injectable()
export class PdfService {
  /**
   * Desenha a folha padrão do Consulado: emblema e designação no topo,
   * morada e logótipos institucionais no rodapé. Aplicada a todas as páginas.
   *
   * Nota: o rodapé é escrito abaixo da margem inferior, o que faria o pdfkit
   * criar uma página nova em cadeia. Por isso a margem é anulada enquanto
   * se desenha, e um sinalizador impede a reentrância.
   */
  private aDesenhar = false;

  private folhaTimbrada(doc: PDFKit.PDFDocument) {
    if (this.aDesenhar) return;
    this.aDesenhar = true;
    const yAnterior = doc.y;
    const margemInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    // --- Cabeçalho ---
    doc.image(EMBLEMA_JPG, (LARGURA_PAGINA - 52) / 2, 34, { width: 52 });
    doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#000000')
      .text('REPÚBLICA DE ANGOLA', 0, 92, { align: 'center', width: LARGURA_PAGINA });
    doc.font('Helvetica').fontSize(10).fillColor('#333333')
      .text('Consulado Geral no Porto', 0, 106, { align: 'center', width: LARGURA_PAGINA });

    // --- Rodapé ---
    const yRodape = 742;
    doc.rect(MARGENS.left, yRodape, 2, 15).fill('#B5121B');
    doc.rect(MARGENS.left, yRodape + 15, 2, 16).fill('#16130F');
    doc.rect(MARGENS.left, yRodape + 31, 2, 15).fill('#D4A017');

    doc.font('Helvetica').fontSize(6.2).fillColor('#333333');
    MORADA.forEach((linha, i) => {
      doc.text(linha, MARGENS.left + 8, yRodape + 2 + i * 8.6, { width: 280, lineBreak: false });
    });

    doc.image(RODAPE_JPG, LARGURA_PAGINA - MARGENS.right - 175, yRodape + 8, { width: 175 });

    doc.fillColor('#000000');
    doc.page.margins.bottom = margemInferior;
    doc.y = yAnterior;
    this.aDesenhar = false;
  }

  /** Novo documento já com a folha timbrada */
  private novoDocumento(titulo: string): { doc: PDFKit.PDFDocument; chunks: Buffer[] } {
    const doc = new PDFDocument({
      size: 'A4',
      margins: MARGENS,
      bufferPages: true,
      info: { Title: titulo, Author: 'Consulado Geral de Angola no Porto', Creator: 'SIGTEC' },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('pageAdded', () => this.folhaTimbrada(doc));
    this.folhaTimbrada(doc);
    return { doc, chunks };
  }

  /** Numera as páginas no final, quando já se conhece o total */
  private numerarPaginas(doc: PDFKit.PDFDocument) {
    const intervalo = doc.bufferedPageRange();
    for (let i = 0; i < intervalo.count; i++) {
      doc.switchToPage(intervalo.start + i);
      doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(7).fillColor('#666666')
        .text(`Página ${i + 1} de ${intervalo.count}`, MARGENS.left, 726,
          { width: LARGURA_UTIL, align: 'right', lineBreak: false });
    }
  }

  private finalizar(doc: PDFKit.PDFDocument, chunks: Buffer[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this.numerarPaginas(doc);
      doc.end();
    });
  }

  private titulo(doc: PDFKit.PDFDocument, texto: string, subtitulo?: string) {
    doc.font('Helvetica').fontSize(8).fillColor('#555555')
      .text('SERVIÇO DE INFORMÁTICA — GESTÃO DE PATRIMÓNIO TECNOLÓGICO',
        MARGENS.left, MARGENS.top - 24, { width: LARGURA_UTIL, align: 'center' });
    const y = doc.y + 4;
    doc.rect(MARGENS.left, y, LARGURA_UTIL / 2, 2.5).fill('#B5121B');
    doc.rect(MARGENS.left + LARGURA_UTIL / 2, y, LARGURA_UTIL / 2, 2.5).fill('#B8860B');
    doc.y = y + 18;
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(15)
      .text(texto, MARGENS.left, doc.y, { width: LARGURA_UTIL, align: 'center' });
    if (subtitulo) {
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(subtitulo, MARGENS.left, doc.y + 2, { width: LARGURA_UTIL, align: 'center' });
    }
    doc.fillColor('#000000').moveDown(1.2);
  }

  /** Tabela com cabeçalho repetido em cada página */
  private tabela(
    doc: PDFKit.PDFDocument,
    colunas: { rotulo: string; largura: number; alinhar?: 'left' | 'right' }[],
    linhas: string[][],
  ) {
    const total = colunas.reduce((s, c) => s + c.largura, 0);
    const escala = LARGURA_UTIL / total;
    const larguras = colunas.map((c) => c.largura * escala);

    const desenharCabecalho = () => {
      const y = doc.y;
      doc.rect(MARGENS.left, y, LARGURA_UTIL, 17).fill('#F0EDE5');
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.5);
      let x = MARGENS.left;
      colunas.forEach((c, i) => {
        doc.text(c.rotulo.toUpperCase(), x + 4, y + 5,
          { width: larguras[i] - 8, align: c.alinhar ?? 'left', lineBreak: false });
        x += larguras[i];
      });
      doc.y = y + 17;
    };

    desenharCabecalho();
    doc.font('Helvetica').fontSize(8).fillColor('#000000');

    for (const linha of linhas) {
      const alturas = linha.map((valor, i) => doc.heightOfString(valor ?? '', { width: larguras[i] - 8 }));
      const altura = Math.max(16, ...alturas) + 6;

      if (doc.y + altura > 700) {
        doc.addPage();
        doc.y = MARGENS.top;
        desenharCabecalho();
        doc.font('Helvetica').fontSize(8).fillColor('#000000');
      }

      const y = doc.y;
      let x = MARGENS.left;
      linha.forEach((valor, i) => {
        doc.text(valor ?? '', x + 4, y + 4, { width: larguras[i] - 8, align: colunas[i].alinhar ?? 'left' });
        x += larguras[i];
      });
      doc.rect(MARGENS.left, y, LARGURA_UTIL, altura).stroke('#CCCCCC');
      doc.y = y + altura;
    }
  }

  private campo(doc: PDFKit.PDFDocument, rotulo: string, valor: string) {
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000')
      .text(`${rotulo}: `, MARGENS.left, doc.y, { continued: true });
    doc.font('Helvetica').text(valor, { align: 'justify', lineGap: 1.5 });
    doc.moveDown(0.35);
  }

  private assinaturas(
    doc: PDFKit.PDFDocument,
    esquerda: { papel: string; nome: string },
    direita: { papel: string; nome: string },
  ) {
    if (doc.y > 600) { doc.addPage(); doc.y = MARGENS.top; }
    doc.moveDown(2.5);
    const y = doc.y;
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    doc.text(esquerda.papel, MARGENS.left, y, { width: 200, align: 'center' });
    doc.text(direita.papel, LARGURA_PAGINA - MARGENS.right - 200, y, { width: 200, align: 'center' });
    doc.moveTo(MARGENS.left + 10, y + 46).lineTo(MARGENS.left + 190, y + 46).stroke('#000000');
    doc.moveTo(LARGURA_PAGINA - MARGENS.right - 190, y + 46).lineTo(LARGURA_PAGINA - MARGENS.right - 10, y + 46).stroke('#000000');
    doc.text(esquerda.nome, MARGENS.left, y + 51, { width: 200, align: 'center' });
    doc.text(direita.nome, LARGURA_PAGINA - MARGENS.right - 200, y + 51, { width: 200, align: 'center' });
  }

  private fmt = (d: Date | string | null) =>
    d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  /* ==================== AUTO DE ABATE ==================== */
  gerarAutoAbate(auto: {
    numero: string; data: Date; aprovadoPor: string; parecerPor: string;
    motivo: string; parecer: string; destino: string; sanitizacao: string;
    activos: { numInventario: string; descricao: string; numSerie: string | null; dataAquisicao: Date }[];
  }): Promise<Buffer> {
    const { doc, chunks } = this.novoDocumento(`Auto de Abate ${auto.numero}`);
    this.titulo(doc, 'AUTO DE ABATE DE BENS', `N.º ${auto.numero} · ${this.fmt(auto.data)}`);

    const d = new Date(auto.data);
    doc.font('Helvetica').fontSize(9.5).text(
      `Aos ${d.getDate()} dias do mês de ${d.toLocaleDateString('pt-PT', { month: 'long' })} de ${d.getFullYear()}, ` +
      'procedeu-se ao abate dos bens tecnológicos abaixo identificados, nos termos do procedimento interno de ' +
      'gestão patrimonial, com fundamento na análise de obsolescência registada no sistema SIGTEC.',
      MARGENS.left, doc.y, { width: LARGURA_UTIL, align: 'justify', lineGap: 2 },
    );
    doc.moveDown(0.8);

    this.tabela(doc,
      [{ rotulo: 'N.º Inventário', largura: 110 }, { rotulo: 'Descrição', largura: 200 },
       { rotulo: 'N.º Série', largura: 105 }, { rotulo: 'Aquisição', largura: 70 }],
      auto.activos.map((a) => [a.numInventario, a.descricao, a.numSerie ?? '—', this.fmt(a.dataAquisicao)]),
    );
    doc.moveDown(1);

    this.campo(doc, 'Motivo do abate', auto.motivo);
    this.campo(doc, 'Parecer técnico', `${auto.parecer} (${auto.parecerPor})`);
    this.campo(doc, 'Destino dos bens', auto.destino);
    this.campo(doc, 'Sanitização de dados', auto.sanitizacao);

    doc.moveDown(0.4).font('Helvetica').fontSize(7.5).fillColor('#555555').text(
      'Os registos completos destes equipamentos permanecem arquivados no sistema SIGTEC para efeitos de ' +
      'auditoria patrimonial. Documento gerado electronicamente — preparado para assinatura electrónica qualificada.',
      MARGENS.left, doc.y, { width: LARGURA_UTIL, align: 'justify' },
    );

    this.assinaturas(doc,
      { papel: 'O Responsável Técnico', nome: auto.parecerPor },
      { papel: 'A Direcção', nome: auto.aprovadoPor });
    return this.finalizar(doc, chunks);
  }

  /* ==================== AUTO DE ENTREGA ==================== */
  gerarAutoEntrega(dados: {
    numero: string; data: Date; funcionario: string; departamento: string; entreguePor: string;
    activos: { numInventario: string; descricao: string; numSerie: string | null; localizacao: string }[];
  }): Promise<Buffer> {
    const { doc, chunks } = this.novoDocumento(`Auto de Entrega ${dados.numero}`);
    this.titulo(doc, 'AUTO DE ENTREGA DE EQUIPAMENTO', `N.º ${dados.numero} · ${this.fmt(dados.data)}`);

    doc.font('Helvetica').fontSize(9.5).text(
      `Declara-se que foram entregues a ${dados.funcionario} (${dados.departamento}) os bens abaixo ` +
      'identificados, que passam à sua responsabilidade para uso exclusivo no exercício das suas funções.',
      MARGENS.left, doc.y, { width: LARGURA_UTIL, align: 'justify', lineGap: 2 },
    );
    doc.moveDown(0.8);

    this.tabela(doc,
      [{ rotulo: 'N.º Inventário', largura: 110 }, { rotulo: 'Descrição', largura: 190 },
       { rotulo: 'N.º Série', largura: 95 }, { rotulo: 'Localização', largura: 90 }],
      dados.activos.map((a) => [a.numInventario, a.descricao, a.numSerie ?? '—', a.localizacao]),
    );
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(9).fillColor('#000000').text(
      'O signatário compromete-se a zelar pela boa conservação dos bens, a comunicar de imediato qualquer ' +
      'avaria ou extravio através do sistema SIGTEC, e a devolvê-los quando cessarem as funções ou por ' +
      'solicitação do Serviço de Informática.',
      MARGENS.left, doc.y, { width: LARGURA_UTIL, align: 'justify', lineGap: 2 },
    );

    this.assinaturas(doc,
      { papel: 'O Serviço de Informática', nome: dados.entreguePor },
      { papel: 'O Funcionário', nome: dados.funcionario });
    return this.finalizar(doc, chunks);
  }

  /* ==================== INVENTÁRIO GERAL ==================== */
  gerarInventario(dados: {
    itens: {
      numInventario: string; designacao: string; piso: string; sala: string;
      sector: string; responsavel: string; estado: string;
    }[];
    filtro?: string;
    emitidoPor: string;
  }): Promise<Buffer> {
    const { doc, chunks } = this.novoDocumento('Inventário de Bens Tecnológicos');
    this.titulo(doc, 'INVENTÁRIO DE BENS TECNOLÓGICOS',
      `${dados.itens.length} registo(s) · ${this.fmt(new Date())}${dados.filtro ? ` · ${dados.filtro}` : ''}`);

    this.tabela(doc,
      [
        { rotulo: 'Inventário', largura: 78 },
        { rotulo: 'Designação', largura: 140 },
        { rotulo: 'Piso / Sala', largura: 85 },
        { rotulo: 'Sector', largura: 78 },
        { rotulo: 'Responsável', largura: 88 },
        { rotulo: 'Estado', largura: 58 },
      ],
      dados.itens.map((i) => [
        i.numInventario, i.designacao,
        [i.piso, i.sala].filter(Boolean).join(' / ') || '—',
        i.sector || '—', i.responsavel || '—', i.estado,
      ]),
    );

    doc.moveDown(1.2).font('Helvetica').fontSize(7.5).fillColor('#555555').text(
      `Documento gerado pelo sistema SIGTEC em ${new Date().toLocaleString('pt-PT')} por ${dados.emitidoPor}. ` +
      'Os equipamentos abatidos permanecem em arquivo e não constam desta listagem salvo indicação em contrário.',
      MARGENS.left, doc.y, { width: LARGURA_UTIL, align: 'justify' },
    );

    return this.finalizar(doc, chunks);
  }

  /* ==================== RELATÓRIO GENÉRICO ==================== */
  gerarRelatorio(dados: {
    titulo: string; subtitulo?: string; emitidoPor: string;
    seccoes: {
      titulo: string;
      texto?: string;
      indicadores?: { rotulo: string; valor: string }[];
      colunas?: { rotulo: string; largura: number; alinhar?: 'left' | 'right' }[];
      linhas?: string[][];
    }[];
    assinatura?: { esquerda: { papel: string; nome: string }; direita: { papel: string; nome: string } };
  }): Promise<Buffer> {
    const { doc, chunks } = this.novoDocumento(dados.titulo);
    this.titulo(doc, dados.titulo.toUpperCase(), dados.subtitulo ?? this.fmt(new Date()));

    for (const s of dados.seccoes) {
      if (doc.y > 640) { doc.addPage(); doc.y = MARGENS.top; }
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#16130F')
        .text(s.titulo, MARGENS.left, doc.y, { width: LARGURA_UTIL });
      const yLinha = doc.y + 2;
      doc.moveTo(MARGENS.left, yLinha).lineTo(MARGENS.left + LARGURA_UTIL, yLinha).stroke('#E2DDD2');
      doc.y = yLinha + 8;

      if (s.texto) {
        doc.font('Helvetica').fontSize(9.5).fillColor('#000000')
          .text(s.texto, MARGENS.left, doc.y, { width: LARGURA_UTIL, align: 'justify', lineGap: 2 });
        doc.moveDown(0.6);
      }

      if (s.indicadores?.length) {
        const porLinha = Math.min(4, s.indicadores.length);
        const largura = LARGURA_UTIL / porLinha;
        let yBase = doc.y;
        s.indicadores.forEach((ind, i) => {
          const coluna = i % porLinha;
          if (coluna === 0 && i > 0) yBase += 42;
          const x = MARGENS.left + coluna * largura;
          doc.font('Helvetica').fontSize(7).fillColor('#666666')
            .text(ind.rotulo.toUpperCase(), x, yBase, { width: largura - 8, lineBreak: false });
          doc.font('Helvetica-Bold').fontSize(15).fillColor('#16130F')
            .text(ind.valor, x, yBase + 11, { width: largura - 8, lineBreak: false });
        });
        doc.y = yBase + 40;
        doc.fillColor('#000000');
      }

      if (s.colunas && s.linhas) this.tabela(doc, s.colunas, s.linhas);
      doc.moveDown(1);
    }

    if (doc.y > 690) { doc.addPage(); doc.y = MARGENS.top; }
    doc.font('Helvetica').fontSize(7.5).fillColor('#555555').text(
      `Documento gerado pelo sistema SIGTEC em ${new Date().toLocaleString('pt-PT')} por ${dados.emitidoPor}.`,
      MARGENS.left, doc.y, { width: LARGURA_UTIL },
    );

    if (dados.assinatura) this.assinaturas(doc, dados.assinatura.esquerda, dados.assinatura.direita);
    return this.finalizar(doc, chunks);
  }
}
