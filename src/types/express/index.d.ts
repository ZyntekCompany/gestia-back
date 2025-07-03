import type { JwtPayload } from 'src/domain/interfaces/jwt-payload.interface';
import { Request } from 'express';
import { UserRole } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

interface RequestWithCookies extends Request {
  cookies: {
    refreshToken?: string;
    accessToken?: string;
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  entityId?: string;
  iat?: number;
  exp?: number;
}
