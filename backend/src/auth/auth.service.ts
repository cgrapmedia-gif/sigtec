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

  /** Aceita o nome de utilizador (primeiro.ultimo) ou, por compatibilidade, o email completo */
  async login(identificador: string, password: string, ip?: string) {
    const id = identificador.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ utilizador: id }, { email: id }] },
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
      utilizador: u.utilizador ?? u.email.split('@')[0],
      email: u.email,
      perfil: u.perfil,
      localizacao: u.localizacao,
      precisaTrocarPassword: u.precisaTrocarPassword,
      permissoes: permissoesDe(u.perfil),
      departamento: u.departamento?.nome ?? null,
    };
  }
}
