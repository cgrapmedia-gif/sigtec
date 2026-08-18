import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
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
