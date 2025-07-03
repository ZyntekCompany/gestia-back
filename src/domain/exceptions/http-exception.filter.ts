import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface ExceptionResponse {
  message?: string;
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errorCode = 'INTERNAL_ERROR';

    // Manejar errores de Prisma
    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'El recurso ya existe en la base de datos';
          errorCode = 'DUPLICATE_ENTRY';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Referencia inválida en la base de datos';
          errorCode = 'FOREIGN_KEY_CONSTRAINT';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Registro no encontrado';
          errorCode = 'RECORD_NOT_FOUND';
          break;
        case 'P2021':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Error en la estructura de la base de datos';
          errorCode = 'TABLE_NOT_FOUND';
          break;
        case 'P2022':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Error en la estructura de la base de datos';
          errorCode = 'COLUMN_NOT_FOUND';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Error en la base de datos';
          errorCode = 'DATABASE_ERROR';
      }
    }
    // Manejar errores HTTP de NestJS
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const typedResponse = exceptionResponse as ExceptionResponse;
        message = typedResponse.message || exception.message;
        errorCode = typedResponse.error || 'HTTP_ERROR';
      } else {
        message = exception.message;
        errorCode = 'HTTP_ERROR';
      }
    }
    // Manejar errores de validación
    else if (exception instanceof Error) {
      if (exception.message.includes('Invalid value for argument')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Datos de entrada inválidos';
        errorCode = 'VALIDATION_ERROR';
      } else {
        message = exception.message;
        errorCode = 'GENERAL_ERROR';
      }
    }

    // Log del error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.error('Exception Filter Error:', {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        exception: exception,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    const errorResponse = {
      statusCode: status,
      message: message,
      error: errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }
}
