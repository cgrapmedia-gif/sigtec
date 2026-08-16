import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  listar() {
    return this.prisma.user.findMany({
      select: { id: true, nome: true, email: true, perfil: true, activo: true, localizacao: true, departamento: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  /** Contas criadas apenas por convite do Administrador (RF-AUTH-02) */
  async criar(dto: { nome: string; email: string; perfil: any; departamentoId?: string; localizacao?: string; passwordTemporaria: string }) {
    const passwordHash = await bcrypt.hash(dto.passwordTemporaria, 10);
    return this.prisma.user.create({
      data: { nome: dto.nome, email: dto.email.toLowerCase(), perfil: dto.perfil, passwordHash, departamentoId: dto.departamentoId, localizacao: dto.localizacao },
      select: { id: true, nome: true, email: true, perfil: true },
    });
  }

  /** Desactivacao sem eliminacao — preserva historico (RF-AUTH-11) */
  desactivar(id: string) {
    return this.prisma.user.update({ where: { id }, data: { activo: false }, select: { id: true, activo: true } });
  }

  departamentos() {
    return this.prisma.departamento.findMany({ orderBy: { nome: 'asc' } });
  }
}
