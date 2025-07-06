// src/interfaces/controllers/user.controller.ts
import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListUsersByEntityUseCase } from 'src/application/use-cases/auth/list-users-by-entity.use-case';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { Request } from 'express';
import { JwtPayload } from 'src/types/express';

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly listUsersByEntity: ListUsersByEntityUseCase) {}

  @ApiOperation({
    summary: 'Listar usuarios por entidad',
    description:
      'Permite listar los usuarios de una entidad específica. Los usuarios con rol SUPER pueden listar usuarios de cualquier entidad (usando el parámetro entityId o sin él para ver todos). Los usuarios con rol ADMIN solo pueden listar los usuarios de su propia entidad.',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: String,
    description: 'ID de la entidad a filtrar. Obligatorio solo para SUPER.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página de resultados para paginación (por defecto 1).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de resultados por página (por defecto 10).',
  })
  @ApiQuery({
    name: 'isEmailVerified',
    required: false,
    type: Boolean,
    description: 'Filtra por verificación de email (true/false).',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filtra por usuarios activos/inactivos (true/false).',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda general por nombre, email, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de usuarios encontrados',
  })
  @ApiResponse({
    status: 403,
    description:
      'Solo los usuarios SUPER o ADMIN pueden consultar usuarios por entidad',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token inválido o expirado.',
  })
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
