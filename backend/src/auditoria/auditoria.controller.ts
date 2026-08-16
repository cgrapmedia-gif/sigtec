import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserActual } from '../auth/user.decorator';
import { AuditoriaService } from './auditoria.service';

@UseGuards(JwtAuthGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private svc: AuditoriaService) {}

  @Get()
  listar(@UserActual() user: any) {
    return this.svc.listar(user);
  }
}
