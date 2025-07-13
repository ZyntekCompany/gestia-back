import {
  Injectable,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PasswordReset } from 'src/domain/entities/password-reset.entity';
import { User } from 'src/domain/entities/User';
import { Emailverify } from 'src/domain/entities/valid-email.entity';
import { AreaRepository } from 'src/domain/repositories/area.repository';
import { EntityRepository } from 'src/domain/repositories/entity.repository';
import { PasswordResetRepository } from 'src/domain/repositories/password-reset.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { VerifyTokenRepository } from 'src/domain/repositories/verify-token.repository';
import { EmailService } from 'src/infrastructure/services/email.service';
import { NestJsJwtService } from 'src/infrastructure/services/nest-jwt.service';
import { PasswordService } from 'src/infrastructure/services/password.service';
import {
  CreateUserResponseDto,
  RegisterCitizenDto,
  RegisterOfficerDto,
} from 'src/interfaces/dtos/user.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
    @Inject('AreaRepository')
    private readonly areaRepository: AreaRepository,
    @Inject('EmailService')
    private readonly emailService: EmailService,
    @Inject('PasswordResetRepository')
    private readonly passwordResetRepository: PasswordResetRepository,
    @Inject('VerifyTokenRepository')
    private readonly verifyTokenRepository: VerifyTokenRepository,
    private readonly jwtService: NestJsJwtService,
  ) {}

  async executeOfficer(
    request: RegisterOfficerDto,
  ): Promise<CreateUserResponseDto> {
    const { email, role, fullName, areaId, entityId } = request;

    // Validar rol
    if (!this.isValidRole(role)) {
      throw new BadRequestException(
        `Rol inválido. Los roles válidos son: ${Object.values(UserRole).join(', ')}`,
      );
    }

    // Validar usuario existente
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // Validar entidad y área según el rol
    if (role === UserRole.SUPER) {
      if (entityId || areaId) {
        throw new BadRequestException(
          'El rol SUPER no requiere entidad ni área',
        );
      }
    } else if (role === UserRole.ADMIN) {
      if (!entityId) {
        throw new BadRequestException(
          'Se requiere el id de la entidad para este rol',
        );
      }
      if (areaId) {
        throw new BadRequestException(
          'El rol ADMIN no debe tener área asignada al crearse',
        );
      }
    } else {
      // Otros roles necesitan entidad y área
      if (!entityId) {
        throw new BadRequestException(
          'Se requiere el id de la entidad para este rol',
        );
      }
      // Validar existencia de entidad
      const entityExists = await this.entityRepository.findById(entityId);
      if (!entityExists) {
        throw new BadRequestException(`La entidad ${entityId} no existe`);
      }
      if (!areaId) {
        throw new BadRequestException(
          'Se requiere el id del área para este rol',
        );
      }
      // Validar que el área pertenezca a la entidad
      const area = await this.areaRepository.findById(areaId);
      if (!area || area.entityId !== entityId) {
        throw new BadRequestException(
          `El área ${areaId} no pertenece a la entidad ${entityId}`,
        );
      }
    }

    // Crear usuario con contraseña temporal
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await this.passwordService.hash(tempPassword);
    const user = User.create(email, hashedPassword, fullName, role);

    // Generar token para establecer contraseña
    const setupToken = this.passwordService.generateResetToken();
    const passwordReset = PasswordReset.create(email, setupToken);
    await this.passwordResetRepository.save(passwordReset);

    try {
      // Guardar usuario
      const savedUser = await this.userRepository.save(
        user,
        request.entityId, // <-- pásalo
        request.areaId, // <-- si aplica
      );

      // Enviar email de bienvenida con token
      await this.sendWelcomeEmail(email, fullName, setupToken);

      return {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: savedUser.role,
        message:
          'Usuario registrado exitosamente. Por favor revisa tu correo para establecer tu contraseña.',
      };
    } catch {
      // Si falla el envío del email, eliminar el usuario creado
      try {
        await this.userRepository.delete(user.id);
        // Buscar y eliminar el token de reset si existe
        const passwordResets =
          await this.passwordResetRepository.findByEmail(email);
        for (const reset of passwordResets) {
          await this.passwordResetRepository.delete(reset.id);
        }
      } catch (deleteError) {
        console.error(
          'Error eliminando usuario después de fallo en email:',
          deleteError,
        );
      }
      throw new BadRequestException(
        'Error enviando email de bienvenida. El usuario no fue creado. Por favor intenta nuevamente.',
      );
    }
  }

  private isValidRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }

  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async sendWelcomeEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    await this.emailService.sendResetEmail(email, fullName, token);
    console.log(`Email de bienvenida enviado a: ${email}`);
  }

  async executeCitizen(
    dto: RegisterCitizenDto,
  ): Promise<CreateUserResponseDto> {
    // 1. Validar que NO venga entityId ni areaId
    if ('entityId' in dto && dto['entityId']) {
      throw new BadRequestException(
        'Un ciudadano no puede estar asociado a entidad al registrarse.',
      );
    }
    if ('areaId' in dto && dto['areaId']) {
      throw new BadRequestException(
        'Un ciudadano no puede estar asociado a área al registrarse.',
      );
    }

    // 2. Validar campos obligatorios
    const requiredFields = [
      'email',
      'password',
      'fullName',
      'typePerson',
      'typeIdentification',
      'numberIdentification',
      'phone',
      'gender',
      'country',
      'birthDate',
      'address',
      'city',
    ];
    for (const field of requiredFields) {
      if (!dto[field]) {
        throw new BadRequestException(`Falta el campo obligatorio: ${field}`);
      }
    }

    // 3. Validar que el usuario no exista
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // 4. Hash de la contraseña
    const hashedPassword = await this.passwordService.hash(dto.password);

    // 5. Crear la entidad User (ajusta según tu constructor, aquí ejemplo clásico)
    const user = new User(
      crypto.randomUUID(),
      dto.email,
      hashedPassword,
      dto.fullName,
      UserRole.CITIZEN,
      false, // isEmailVerified
      true, // active
      new Date(),
      new Date(),
      undefined, // entity
      undefined, // area
    );

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      entityId: user.entity?.id,
    };
    const verifyTokenValue = this.jwtService.generateRefreshToken(payload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // 6. Guarda el usuario con todos los campos personalizados
    // (Ajusta el método del repositorio para aceptar los campos extra)
    const savedUser = await this.userRepository.saveCitizen(user, {
      typePerson: dto.typePerson,
      typeIdentification: dto.typeIdentification,
      numberIdentification: dto.numberIdentification,
      phone: dto.phone,
      gender: dto.gender,
      country: dto.country,
      birthDate: new Date(dto.birthDate),
      address: dto.address,
      city: dto.city,
    });

    const refreshToken = Emailverify.create(
      user.id,
      verifyTokenValue,
      expiresAt,
    );
    await this.verifyTokenRepository.save(refreshToken);

    await this.emailService.sendEmailVerification(
      dto.email,
      dto.fullName,
      verifyTokenValue,
    );

    console.log('Usuario creado:', savedUser.id, savedUser.email);

    // 7. Respuesta DTO
    return {
      id: savedUser.id,
      email: savedUser.email,
      fullName: savedUser.fullName,
      role: savedUser.role,
      message:
        'Usuario ciudadano registrado exitosamente. Puedes iniciar sesión.',
    };
  }
}
