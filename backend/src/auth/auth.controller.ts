import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserActual } from './user.decorator';
import { DESCRICOES, GRUPOS, PERMISSOES, permissoesDe } from '../comum/permissoes';

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.auth.login(dto.email, dto.password, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@UserActual() user: any) {
    return this.auth.me(user.id);
  }

  /** Permissões do perfil em sessão */
  @UseGuards(JwtAuthGuard)
  @Get('permissoes')
  permissoes(@UserActual() user: any) {
    return { perfil: user.perfil, permissoes: permissoesDe(user.perfil) };
  }

  /** Quadro completo de permissões — transparência sobre quem pode fazer o quê */
  @UseGuards(JwtAuthGuard)
  @Get('matriz-permissoes')
  matriz() {
    return {
      perfis: ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
      grupos: GRUPOS,
      descricoes: DESCRICOES,
      matriz: PERMISSOES,
    };
  }
}
