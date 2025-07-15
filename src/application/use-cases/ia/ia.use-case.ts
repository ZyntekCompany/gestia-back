import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class IaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async generateResponse(id: string, prompt: string): Promise<any> {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        citizen: true,
        procedure: true,
        assignedTo: true,
      },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const relevantData = {
      subject: request.subject,
      content: request.content,
      status: request.status,
      procedure: {
        name: request.procedure.name,
        pqrsType: request.procedure.pqrsType,
      },
      citizen: {
        fullName: request.citizen.fullName,
        email: request.citizen.email,
      },
      assignedTo: request.assignedTo
        ? {
            fullName: request.assignedTo.fullName,
            email: request.assignedTo.email,
          }
        : null,
    };

    const fullPrompt = `
      Eres un asistente virtual altamente calificado, especializado en la redacción de documentos formales y protocolares.
      Tu tarea es generar una respuesta profesional y adecuada basada en la información de la solicitud que se te proporciona.
      A continuación, se detallan los datos relevantes de la solicitud:

      - Asunto: ${relevantData.subject}
      - Contenido de la solicitud: ${JSON.stringify(relevantData.content)}
      - Estado actual: ${relevantData.status}
      - Procedimiento relacionado: ${relevantData.procedure.name} (Tipo: ${relevantData.procedure.pqrsType})
      - Información del solicitante: Nombre: ${relevantData.citizen.fullName}, Email: ${relevantData.citizen.email}
      - Funcionario asignado: ${relevantData.assignedTo ? `${relevantData.assignedTo.fullName} (${relevantData.assignedTo.email})` : 'No asignado'}

      Considerando el siguiente requerimiento del usuario: "${prompt}", redacta el documento solicitado de manera formal y precisa.
    `;

    const response = await axios.post('https://ia.eduadminsoft.shop/IA/text', {
      prompt: fullPrompt,
    });

    return response.data;
  }
}
