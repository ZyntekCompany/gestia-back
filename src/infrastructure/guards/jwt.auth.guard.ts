import {
  Injectable,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { NestJsJwtService } from '../services/nest-jwt.service';

// Extiende la interfaz Request para incluir cookies
interface RequestWithCookies extends Request {
  cookies: {
    accessToken?: string;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: NestJsJwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      console.error('JWT Verification Error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: RequestWithCookies): string | undefined {
    // Intenta obtener el token del header de autorización
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer') {
        return token;
      }
    }

    // Si no hay token en el header, intenta obtenerlo de las cookies
    return request.cookies?.accessToken;
  }
}
