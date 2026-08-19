import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { permissoesDe } from '../comum/permissoes';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private auditoria: AuditoriaService,
  ) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { departamento: true },
    });
    if (!user || !user.activo) throw new UnauthorizedException('Credenciais inválidas.');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas.');

    await this.auditoria.registar({
      quemNome: user.nome,
      quemPerfil: user.perfil,
      accao: 'Iniciou sessão',
      titularNome: user.nome,
      ip,
    });

    const payload = { sub: user.id, email: user.email, perfil: user.perfil, nome: user.nome };
    return {
      access_token: await this.jwt.signAsync(payload),
      user: this.publico(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { departamento: true },
    });
    return this.publico(user);
  }

  private publico(u: any) {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      localizacao: u.localizacao,
      precisaTrocarPassword: u.precisaTrocarPassword,
      permissoes: permissoesDe(u.perfil),
      departamento: u.departamento?.nome ?? null,
    };
  }
}
