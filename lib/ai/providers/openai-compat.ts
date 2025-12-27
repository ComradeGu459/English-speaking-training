import OpenAI from 'openai';
import { AIProvider, GenRequest, GenResponse, ProviderType } from '../types';
import { parseJsonStrict } from '../utils';

export class OpenAICompatibleProvider implements AIProvider {
  private client: OpenAI;
  public name: ProviderType;
  private modelName: string;
  private _isHealthy: boolean = true;

  constructor(name: ProviderType, baseUrl: string, apiKey: string, defaultModel: string) {
    this.name = name;
    this.modelName = defaultModel;
    
    // Only initialize if API key is present
    if (apiKey) {
      this.client = new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
        dangerouslyAllowBrowser: true 
      });
    } else {
      // Dummy client or mark as unhealthy
      this._isHealthy = false;
      this.client = null as any; 
    }
  }

  isHealthy() { return this._isHealthy && !!this.client; }

  async generateText(req: GenRequest): Promise<GenResponse<string>> {
    if (!this.client) throw new Error(`${this.name} client not initialized (missing API key?)`);

    try {
      const response = await this.client.chat.completions.create({
        model: req.model || this.modelName,
        messages: [
          { role: 'system', content: req.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: req.prompt }
        ],
        temperature: req.temperature ?? 0.7,
        response_format: req.jsonMode ? { type: 'json_object' } : undefined
      });

      const text = response.choices[0]?.message?.content || '';
      return {
        text,
        provider: this.name,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      console.error(`[${this.name}] API Error:`, error);
      throw error; 
    }
  }

  async generateJson<T>(req: GenRequest): Promise<GenResponse<T>> {
    const res = await this.generateText({ ...req, jsonMode: true });
    try {
      const data = parseJsonStrict<T>(res.text); 
      return { ...res, data };
    } catch (e) {
      throw new Error(`[${this.name}] JSON Parse Error: ${(e as Error).message}`);
    }
  }
}
