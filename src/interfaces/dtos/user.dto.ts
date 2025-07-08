import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtPayload } from 'src/types/express';

export class RegisterOfficerDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  role: UserRole; // 'OFFICER' o 'ADMIN'

  @ApiProperty()
  entityId?: string;

  @ApiProperty()
  areaId?: string;
  // Lo demás, lo llenan después del login.
}

export class CreateUserResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  role: UserRole;

  message: string;
}

export class LogoutRequestDto {
  @ApiProperty({ example: 'refresh-token' })
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty({ example: 'refresh-token' })
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: 'usuario@email.com' })
  email: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'If the email exists, a password reset link has been sent.',
  })
  message: string;
}

export class LoginRequestDto {
  @ApiProperty({ example: 'usuario@email.com' })
  email: string;
  @ApiProperty({ example: 'password123' })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
  @ApiProperty()
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  activate: boolean;
  isEmailVerified: boolean;
  entity?: { id: string; name: string; imgUrl: string } | null;
  area?: { id: string; name: string } | null;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'token-reset' })
  token: string;
  @ApiProperty({ example: 'nuevaPassword123' })
  newPassword: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    example:
      'La contraseña ha sido restablecida exitosamente. Por favor inicia sesión con tu nueva contraseña.',
  })
  message: string;
}

export class DeleteUserRequestDto {
  @ApiProperty()
  id: string;
}

export class RegisterCitizenDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  typePerson: string;

  @ApiProperty()
  typeIdentification: string;

  @ApiProperty()
  numberIdentification: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  birthDate: Date;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  // role: 'CITIZEN' fijo, no lo pide el usuario
}

export class UpdateCitizenDto {
  user: JwtPayload;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  password?: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  isEmailVerified?: boolean;

  @ApiPropertyOptional()
  typePerson?: string;

  @ApiPropertyOptional()
  typeIdentification?: string;

  @ApiPropertyOptional()
  numberIdentification?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  gender?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  birthDate: Date; // <--- IMPORTANTE

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;
}

export class AreaDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class UserListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiProperty() role: string;
  @ApiProperty() isEmailVerified: boolean;
  @ApiProperty() active: boolean;
  @ApiProperty({ type: AreaDto, required: false }) area?: AreaDto; // <---
}

export class EntityWithUsersDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() imgUrl: string;
  @ApiProperty({ type: [UserListItemDto] }) users: UserListItemDto[];
}

export class UserListPaginatedDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageCount: number; // <--- nuevo campo
  @ApiProperty({ type: [EntityWithUsersDto] }) entities: EntityWithUsersDto[];
}

export class UpdateUserByAdminDto {
  @ApiPropertyOptional({ description: 'Nuevo correo electrónico del usuario.' })
  email?: string;

  @ApiPropertyOptional({ description: 'Nuevo nombre completo del usuario.' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'Nuevo ID de área asignada al usuario.' })
  areaId?: string;
}
