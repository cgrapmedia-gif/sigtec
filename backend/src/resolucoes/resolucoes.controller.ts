import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { ResolucoesService } from './resolucoes.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Perfis('ADMIN', 'TECNICO')
@Controller('resolucoes')
export class ResolucoesController {
  constructor(private svc: ResolucoesService) {}

  @Get()
  listar() { return this.svc.listar(); }

  @Get('pedido/:pedidoId')
  sugerir(@Param('pedidoId') pedidoId: string) { return this.svc.sugerirParaPedido(pedidoId); }

  @Post()
  criar(@Body() dto: any) { return this.svc.criar(dto); }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: any) { return this.svc.actualizar(id, dto); }

  @Post(':id/uso')
  uso(@Param('id') id: string, @Body('resolveu') resolveu: boolean) { return this.svc.registarUso(id, !!resolveu); }
}
