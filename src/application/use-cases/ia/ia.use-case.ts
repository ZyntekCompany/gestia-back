import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { FindHistoryUseCase } from '../request/find-history.usecase';
import { GeminiService } from 'src/infrastructure/services/gemini.service';

@Injectable()
export class IaUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FindHistoryUseCase)
    private readonly findHistoryUseCase: FindHistoryUseCase,
    private readonly geminiService: GeminiService,
  ) {}

  async generateResponse(id: string, prompt: string): Promise<any> {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        citizen: true,
        procedure: true,
        assignedTo: true,
        RequestUpdate: true,
      },
    });

    if (!request) {
      throw new Error('Request not found');
    }
    const history = await this.findHistoryUseCase.execute(id);
    const relevantData = {
      radicado: String(request.radicado ?? ''),
      subject: request.subject,
      content: request.content,
      status: request.status,
      procedure: {
        name: request.procedure.name,
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
Eres un asistente virtual experto en redacción de documentos formales para atención de solicitudes ciudadanas. Tu tarea es generar una respuesta **en formato HTML bien estructurado**, aplicando normas de redacción administrativa institucional.

📝 Estructura esperada:
- Debe incluir: encabezado con asunto, fecha, remitente, destinatario y referencia.
- Cuerpo del mensaje con redacción formal clara, separada por párrafos.
- Cierre cordial con firma.
- Usa etiquetas HTML: <p>, <strong>, <br>, <hr>, etc.
- No generes todo en un solo párrafo, organiza por secciones.

📄 Datos de la solicitud:
<ul>
  <li><strong>Asunto:</strong> ${relevantData.subject}</li>
  <li><strong>Contenido:</strong> ${JSON.stringify(relevantData.content)}</li>
  <li><strong>Estado:</strong> ${relevantData.status}</li>
  <li><strong>Procedimiento:</strong> ${relevantData.procedure.name}</li>
  <li><strong>Solicitante:</strong> ${relevantData.citizen.fullName} (${relevantData.citizen.email})</li>
  <li><strong>Funcionario asignado:</strong> ${
    relevantData.assignedTo
      ? `${relevantData.assignedTo.fullName} (${relevantData.assignedTo.email})`
      : 'No asignado'
  }</li>
  <li><strong>Historial:</strong> ${JSON.stringify(history)}</li>
</ul>

Redacta la respuesta institucional solicitada por el usuario a partir del siguiente requerimiento: "${prompt}"
Recuerda: responde en HTML estructurado, profesional, sin errores de sintaxis ni estilo.
`;

    const generatedText = await this.geminiService.generateText(fullPrompt);
    return { text: generatedText };
  }
}
