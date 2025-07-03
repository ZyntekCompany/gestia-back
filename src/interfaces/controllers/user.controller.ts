// src/interfaces/controllers/user.controller.ts
import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListUsersByEntityUseCase } from 'src/application/use-cases/auth/list-users-by-entity.use-case';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { Request } from 'express';
import { JwtPayload } from 'src/types/express';

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly listUsersByEntity: ListUsersByEntityUseCase) {}

  @Get('by-entity')
  async getUsersByEntity(
    @Req() req: Request & { user: JwtPayload },
    @Query('entityId') entityId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('isEmailVerified') isEmailVerified?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ) {
    // ----> Saca rol y entityId del usuario autenticado
    const { role, entityId: userEntityId } = req.user as JwtPayload;

    // Parsea bools
    const emailVerifiedBool =
      isEmailVerified === 'true'
        ? true
        : isEmailVerified === 'false'
          ? false
          : undefined;
    const activeBool =
      active === 'true' ? true : active === 'false' ? false : undefined;

    if (role === 'SUPER') {
      // Puede filtrar cualquier entidad, o ninguna para ver todas
      return this.listUsersByEntity.execute({
        entityId,
        page: Number(page),
        limit: Number(limit),
        isEmailVerified: emailVerifiedBool,
        active: activeBool,
        search,
        forAdmin: false,
      });
    }

    if (role === 'ADMIN') {
      // Siempre fuerza su entidad, NUNCA puede ver otra
      return this.listUsersByEntity.execute({
        entityId: userEntityId,
        page: Number(page),
        limit: Number(limit),
        isEmailVerified: emailVerifiedBool,
        active: activeBool,
        search,
        forAdmin: true,
      });
    }

    throw new ForbiddenException(
      'Solo los usuarios SUPER o ADMIN pueden consultar usuarios por entidad',
    );
  }
}
