import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, GenRequest, GenResponse } from '../types';

export class GeminiProvider implements AIProvider {
  public name = 'gemini' as const;
  private client: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, defaultModel: string = 'gemini-3-flash-preview') {
    this.client = new GoogleGenAI({ apiKey });
    this.modelName = defaultModel;
  }

  isHealthy() { return true; }

  async generateText(req: GenRequest): Promise<GenResponse<string>> {
    try {
      const config: any = {
        temperature: req.temperature,
      };
      
      if (req.jsonMode) {
        config.responseMimeType = "application/json";
      }

      // Gemini 3 Flash / 2.5 uses systemInstruction in config
      if (req.systemPrompt) {
          config.systemInstruction = req.systemPrompt;
      }

      const response = await this.client.models.generateContent({
        model: req.model || this.modelName,
        contents: req.prompt,
        config: config
      });
      
      return {
        text: response.text || '',
        provider: this.name,
        // usage: response.usageMetadata... (omit for simplicity if not critical)
      };
    } catch (error) {
       console.error(`[Gemini] Error:`, error);
       throw error;
    }
  }

  async generateJson<T>(req: GenRequest): Promise<GenResponse<T>> {
      // Gemini supports native JSON schema if we define it, 
      // but for generic flexible JSON mode, simply asking for JSON MIME type is often enough 
      // or parsing the text result.
      const res = await this.generateText({ ...req, jsonMode: true });
      return { ...res, data: JSON.parse(res.text) };
  }
}
