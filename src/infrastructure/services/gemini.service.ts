import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private textModel: GenerativeModel;
  private visionModel: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error(
        'GEMINI_API_KEY no está definida en las variables de entorno.',
      );
      throw new InternalServerErrorException(
        'Configuración de API key faltante.',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.textModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
    this.visionModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  /**
   * Genera texto a partir de un prompt.
   * @param prompt El texto de entrada para el modelo.
   * @returns El texto generado por el modelo.
   */
  async generateText(prompt: string): Promise<string> {
    try {
      this.logger.log(`Generando texto con prompt: "${prompt}"`);
      const result = await this.textModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      this.logger.log('Texto generado exitosamente.');
      return text;
    } catch (error) {
      this.logger.error(`Error al generar texto: ${error}`, error);
      throw new InternalServerErrorException(
        `Error al procesar la solicitud de texto: ${error}`,
      );
    }
  }

  /**
   * Genera texto a partir de un prompt y una imagen.
   * @param prompt El texto de entrada para el modelo.
   * @param base64Image La imagen en formato base64.
   * @param mimeType El tipo MIME de la imagen (ej. 'image/jpeg', 'image/png').
   * @returns El texto generado por el modelo.
   */
  async generateTextFromImage(
    prompt: string,
    base64Image: string,
    mimeType: string,
  ): Promise<string> {
    try {
      this.logger.log(
        `Generando texto con prompt y imagen (MIME: ${mimeType})`,
      );
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };

      const result = await this.visionModel.generateContent([
        prompt,
        imagePart,
      ]);
      const response = result.response;
      const text = response.text();
      this.logger.log('Texto generado desde imagen exitosamente.');
      return text;
    } catch (error) {
      this.logger.error(`Error al generar texto desde imagen: ${error}`, error);
      throw new InternalServerErrorException(
        `Error al procesar la solicitud con imagen: ${error}`,
      );
    }
  }
}
