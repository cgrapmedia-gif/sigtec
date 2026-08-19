import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { RelatoriosService } from './relatorios.service';

@Controller('relatorios')
export class RelatoriosController {
  constructor(private svc: RelatoriosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  @Get()
  indicadores() { return this.svc.indicadores(); }

  /** Painel público de indicadores — transparência por omissão, sem autenticação */
  @Get('publico')
  publico() { return this.svc.digitalizacao(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  @Get('inventario')
  inventario(@Query() q: any) {
    return this.svc.inventarioCompleto({ tipo: q.tipo, sector: q.sector, piso: q.piso, incluirAbatidos: q.abatidos === '1' });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  @Get('inventario.pdf')
  async inventarioPdf(@Query() q: any, @UserActual() user: any, @Res() res: Response) {
    const buffer = await this.svc.pdfInventario(
      { tipo: q.tipo, sector: q.sector, piso: q.piso, incluirAbatidos: q.abatidos === '1' }, user.nome);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Inventario-SIGTEC-${new Date().toISOString().slice(0, 10)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  @Get('relatorio.pdf')
  async relatorioPdf(@UserActual() user: any, @Res() res: Response) {
    const buffer = await this.svc.pdfRelatorio(user.nome);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Relatorio-SIGTEC-${new Date().toISOString().slice(0, 10)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  @Get('inventario.csv')
  async csv(@Res() res: Response) {
    const csv = await this.svc.csvInventario();
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inventario-sigtec-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
    res.send(csv);
  }
}
