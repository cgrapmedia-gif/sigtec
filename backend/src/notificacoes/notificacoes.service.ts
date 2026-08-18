import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  listar(userId: string) {
    return this.prisma.notificacao.findMany({
      where: { userId },
      orderBy: { criadoEm: 'desc' },
      take: 30,
    });
  }

  async contarPorLer(userId: string) {
    const total = await this.prisma.notificacao.count({ where: { userId, lida: false } });
    return { total };
  }

  marcarLida(id: string, userId: string) {
    return this.prisma.notificacao.updateMany({ where: { id, userId }, data: { lida: true } });
  }

  lerTodas(userId: string) {
    return this.prisma.notificacao.updateMany({ where: { userId, lida: false }, data: { lida: true } });
  }

  /** Cria uma notificação para um utilizador específico */
  criar(userId: string, titulo: string, corpo?: string, link?: string) {
    return this.prisma.notificacao.create({ data: { userId, titulo, corpo, link } });
  }

  /** Cria a mesma notificação para todos os utilizadores activos de um ou mais perfis */
  async criarParaPerfis(perfis: any[], titulo: string, corpo?: string, link?: string) {
    const users = await this.prisma.user.findMany({ where: { perfil: { in: perfis }, activo: true }, select: { id: true } });
    if (users.length === 0) return { count: 0 };
    return this.prisma.notificacao.createMany({
      data: users.map((u) => ({ userId: u.id, titulo, corpo, link })),
    });
  }
}
