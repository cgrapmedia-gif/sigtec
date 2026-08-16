import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

class CriarUserDto {
  @IsString() nome!: string;
  @IsEmail() email!: string;
  @IsIn(['ADMIN', 'TECNICO', 'FUNCIONARIO', 'DIRECCAO']) perfil!: string;
  @IsOptional() @IsString() departamentoId?: string;
  @IsOptional() @IsString() localizacao?: string;
  @IsString() @MinLength(8) passwordTemporaria!: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get() @Perfis('ADMIN', 'DIRECCAO')
  listar() { return this.svc.listar(); }

  @Get('departamentos')
  departamentos() { return this.svc.departamentos(); }

  @Post() @Perfis('ADMIN')
  criar(@Body() dto: CriarUserDto) { return this.svc.criar(dto as any); }

  @Patch(':id/desactivar') @Perfis('ADMIN')
  desactivar(@Param('id') id: string) { return this.svc.desactivar(id); }
}
