import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERFIS_KEY = 'perfis';
export const Perfis = (...perfis: string[]) => SetMetadata(PERFIS_KEY, perfis);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const perfis = this.reflector.getAllAndOverride<string[]>(PERFIS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!perfis || perfis.length === 0) return true;
    const { user } = ctx.switchToHttp().getRequest();
    if (!user || !perfis.includes(user.perfil)) {
      throw new ForbiddenException('Sem permissão para esta operação.');
    }
    return true;
  }
}
