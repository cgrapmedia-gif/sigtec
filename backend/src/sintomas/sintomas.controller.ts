import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { SintomasService } from './sintomas.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sintomas')
export class SintomasController {
  constructor(private svc: SintomasService) {}

  @Get()
  listar(@Query('todos') todos?: string) {
    return todos === '1' ? this.svc.listarTodos() : this.svc.listarAgrupados();
  }

  @Get('frequentes')
  frequentes() { return this.svc.frequentes(); }

  @Post() @Perfis('ADMIN', 'TECNICO')
  criar(@Body() dto: any) { return this.svc.criar(dto); }

  @Patch(':id') @Perfis('ADMIN', 'TECNICO')
  actualizar(@Param('id') id: string, @Body() dto: any) { return this.svc.actualizar(id, dto); }

  @Post(':id/auto-ajuda')
  autoAjuda(@Param('id') id: string) { return this.svc.registarAutoAjuda(id); }
}
