import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { FornecedoresService } from './fornecedores.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
@Controller()
export class FornecedoresController {
  constructor(private svc: FornecedoresService) {}

  @Get('fornecedores')
  listar() { return this.svc.listar(); }

  @Post('fornecedores') @Perfis('ADMIN')
  criar(@Body() dto: any) { return this.svc.criar(dto); }

  @Patch('fornecedores/:id') @Perfis('ADMIN')
  actualizar(@Param('id') id: string, @Body() dto: any) { return this.svc.actualizar(id, dto); }

  @Get('contratos')
  contratos() { return this.svc.listarContratos(); }

  @Get('contratos/alertas')
  alertas() { return this.svc.contratosAExpirar(); }

  @Post('contratos') @Perfis('ADMIN')
  criarContrato(@Body() dto: any) { return this.svc.criarContrato(dto); }

  @Patch('contratos/:id') @Perfis('ADMIN')
  actualizarContrato(@Param('id') id: string, @Body() dto: any) { return this.svc.actualizarContrato(id, dto); }
}
