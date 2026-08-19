import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { ActivosService } from './activos.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activos')
export class ActivosController {
  constructor(private svc: ActivosService) {}

  @Get() @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  listar(@Query('tipo') tipo?: string) { return this.svc.listar(tipo); }

  /** Único endpoint de inventário acessível a funcionários: apenas os itens do próprio */
  @Get('meus')
  meus(@UserActual() user: any) { return this.svc.meus(user.id); }

  @Get('candidatos-abate') @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  candidatos() { return this.svc.candidatosAbate(); }

  @Get(':id') @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  obter(@Param('id') id: string, @UserActual() user: any) { return this.svc.obter(id, user); }

  @Get(':id/impacto') @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  impacto(@Param('id') id: string) { return this.svc.analiseImpacto(id); }

  @Post() @Perfis('ADMIN', 'TECNICO')
  criar(@Body() dto: any, @UserActual() user: any) { return this.svc.criar(dto, user); }

  @Post('lote') @Perfis('ADMIN', 'TECNICO')
  criarLote(@Body() dto: any, @UserActual() user: any) { return this.svc.criarLote(dto, user); }

  @Patch(':id') @Perfis('ADMIN', 'TECNICO')
  actualizar(@Param('id') id: string, @Body() dto: any, @UserActual() user: any) {
    return this.svc.actualizar(id, dto, user);
  }

  @Post(':id/eventos') @Perfis('ADMIN', 'TECNICO')
  registarEvento(@Param('id') id: string, @Body() dto: any, @UserActual() user: any) {
    return this.svc.registarEvento(id, dto, user);
  }

  @Post('relacoes') @Perfis('ADMIN', 'TECNICO')
  criarRelacao(@Body() dto: any) { return this.svc.criarRelacao(dto); }

  @Delete('relacoes/:id') @Perfis('ADMIN', 'TECNICO')
  removerRelacao(@Param('id') id: string) { return this.svc.removerRelacao(id); }
}
