import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterUseCase } from 'src/application/use-cases/auth/register-user.use-case';
import {
  CreateUserResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  DeleteUserRequestDto,
  RegisterCitizenDto,
  RegisterOfficerDto,
  UpdateCitizenDto,
} from '../dtos/user.dto';
import { LoginUseCase } from 'src/application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from 'src/application/use-cases/auth/refresh-token.use-case';
import { ForgotPasswordUseCase } from 'src/application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from 'src/application/use-cases/auth/reset-password.use-case';
import { LogoutUseCase } from 'src/application/use-cases/auth/logout.use-case';
import { RequestWithCookies, JwtPayload } from 'src/types/express';
import { Request, Response } from 'express';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { VerifyEmailUseCase } from 'src/application/use-cases/auth/verify-email.use-case';
import { UpdateUserUseCase } from 'src/application/use-cases/auth/update.use-case';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt.auth.guard';
import { UpdateUserByAdminUseCase } from 'src/application/use-cases/auth/update-user-by.use-case';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateUserByAdminUseCase: UpdateUserByAdminUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  private getCookieConfig(req: Request) {
    const origin = req.headers.origin || '';
    const allowedOrigins = [
      'https://www.eduadminsoft.shop',
      'https://eduadminsoft.shop',
    ];
    const isProduction = allowedOrigins.includes(origin);

    return {
      secure: true, // Requerido para SameSite=None
      sameSite: 'none' as const, // Requerido para cross-site
      domain: isProduction ? '.eduadminsoft.shop' : undefined,
    };
  }

  @Post('register-citizen')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterCitizenDto })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    type: CreateUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerCitizen(@Body() request: RegisterCitizenDto) {
    return this.registerUseCase.executeCitizen(request);
  }

  @Post('register-officer')
  @HttpCode(HttpStatus.CREATED)
  async registerOfficer(@Body() request: RegisterOfficerDto) {
    return this.registerUseCase.executeOfficer(request);
  }

  @Post('iniciar-sesion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() request: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.loginUseCase.execute(request);
    const cookieConfig = this.getCookieConfig(req);

    // Configuración de cookies para refreshToken
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/',
      domain: cookieConfig.domain,
    });

    // Configuración de cookies para accessToken
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: 35 * 60 * 1000, // 35 minutos
      path: '/',
      domain: cookieConfig.domain,
    });

    return result;
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
    });

    const cookieConfig = this.getCookieConfig(req);

    // Configuración de cookies para refreshFFFToken
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      domain: cookieConfig.domain,
    });

    // Configuración de cookies para accessToken
    res.cookie('accessToken', result.accessToken, {
      httpOnly: false,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: '/',
      domain: cookieConfig.domain,
      maxAge: 35 * 60 * 1000, // 35 minutos
    });

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(@Body() request: ForgotPasswordRequestDto) {
    return this.forgotPasswordUseCase.execute(request);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() request: ResetPasswordRequestDto) {
    return this.resetPasswordUseCase.execute(request);
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Invalida el token en la base de datos
      await this.logoutUseCase.execute({ refreshToken });
    }

    const cookieConfig = this.getCookieConfig(req);

    // Limpia las cookies del navegador
    res.clearCookie('accessToken', {
      httpOnly: false,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: '/',
      domain: cookieConfig.domain,
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: '/',
      domain: cookieConfig.domain,
    });

    return { message: 'Logged out successfully' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  @ApiBody({ type: DeleteUserRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado correctamente',
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async deleteUser(@Body() request: DeleteUserRequestDto) {
    await this.userRepository.delete(request.id);
    return { message: 'Usuario eliminado correctamente' };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar perfil ciudadano' })
  @ApiResponse({
    status: 200,
    description: 'Usuario Actualizado correctamente',
    type: UpdateCitizenDto,
  })
  updateMe(@Req() req: { user: JwtPayload }, @Body() dto: UpdateCitizenDto) {
    if (!req || !req.user?.sub) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.updateUserUseCase.execute(req.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar a otro usuario (solo admin/super)' })
  async updateUserByAdmin(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() dto: UpdateCitizenDto,
  ) {
    if (!req?.user?.sub) throw new UnauthorizedException('No autenticado');
    // Aquí puede ir un guard de rol, pero también puedes validar en el UseCase
    return this.updateUserByAdminUseCase.execute(req.user, id, dto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verifica el email con un token' })
  @ApiResponse({ status: 200, description: 'Correo verificado correctamente' })
  verifyEmail(@Query('token') token: string) {
    return this.verifyEmailUseCase.execute(token);
  }
}
