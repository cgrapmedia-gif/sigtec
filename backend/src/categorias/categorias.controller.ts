import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { CategoriasService } from './categorias.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categorias')
export class CategoriasController {
  constructor(private svc: CategoriasService) {}

  @Get()
  listar(@Query('todas') todas?: string) { return this.svc.listar(todas === '1'); }

  @Post() @Perfis('ADMIN')
  criar(@Body() dto: any) { return this.svc.criar(dto); }

  @Patch(':id') @Perfis('ADMIN')
  actualizar(@Param('id') id: string, @Body() dto: any) { return this.svc.actualizar(id, dto); }
}
