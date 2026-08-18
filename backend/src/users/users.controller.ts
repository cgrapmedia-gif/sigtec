import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { UsersService } from './users.service';

class CriarUserDto {
  @IsString() @MinLength(3) nome!: string;
  @IsEmail() email!: string;
  @IsIn(['ADMIN', 'TECNICO', 'FUNCIONARIO', 'DIRECCAO']) perfil!: string;
  @IsOptional() @IsString() departamentoId?: string;
  @IsOptional() @IsString() localizacao?: string;
}

class AlterarPasswordDto {
  @IsString() actual!: string;
  @IsString() @MinLength(8) nova!: string;
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
  criar(@Body() dto: CriarUserDto, @UserActual() user: any) { return this.svc.criar(dto as any, user); }

  @Patch('password')
  alterarPassword(@Body() dto: AlterarPasswordDto, @UserActual() user: any) {
    return this.svc.alterarPassword(user.id, dto.actual, dto.nova);
  }

  @Patch(':id/desactivar') @Perfis('ADMIN')
  desactivar(@Param('id') id: string, @UserActual() user: any) { return this.svc.definirActivo(id, false, user); }

  @Patch(':id/reactivar') @Perfis('ADMIN')
  reactivar(@Param('id') id: string, @UserActual() user: any) { return this.svc.definirActivo(id, true, user); }

  @Patch(':id/repor-password') @Perfis('ADMIN')
  reporPassword(@Param('id') id: string, @UserActual() user: any) { return this.svc.reporPassword(id, user); }
}
