import { AIProvider, GenRequest, GenResponse } from '../types';
import { QwenAudioConfig } from '../../userSettings';

export class QwenAudioProvider implements AIProvider {
  public name = 'qwen-audio' as const;
  private config: QwenAudioConfig;
  
  constructor(config: QwenAudioConfig) {
    this.config = config;
  }

  isHealthy() {
    return this.config.enabled && !!this.config.apiKey;
  }

  // DashScope Multimodal Generation API
  // https://help.aliyun.com/zh/dashscope/developer-reference/qwen-audio-api
  async generateText(req: GenRequest): Promise<GenResponse<string>> {
    if (!this.isHealthy()) throw new Error("Qwen Audio is disabled or missing API Key.");

    const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    
    // Construct Input Content
    const contents: any[] = [];
    
    // 1. Audio input
    if (req.audioUrl) {
        contents.push({ audio: req.audioUrl });
    }
    
    // 2. Text input
    contents.push({ text: req.prompt });

    const body = {
        model: this.config.model || 'qwen2-audio-instruct',
        input: {
            messages: [
                {
                    role: 'user',
                    content: contents
                }
            ]
        },
        parameters: {
            result_format: 'message' // Compatible style output
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
                // 'X-DashScope-WorkSpace': ... (Optional)
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Qwen Audio API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        
        // DashScope Response Format
        // { output: { choices: [ { message: { content: ... } } ] } }
        const text = data.output?.choices?.[0]?.message?.content?.[0]?.text || 
                     data.output?.choices?.[0]?.message?.content || 
                     '';

        return {
            text: typeof text === 'string' ? text : JSON.stringify(text),
            provider: 'qwen-audio',
            usage: {
                inputTokens: data.usage?.input_tokens || 0,
                outputTokens: data.usage?.output_tokens || 0
            }
        };

    } catch (e) {
        console.error("Qwen Audio Request Failed:", e);
        throw e;
    }
  }

  async generateJson<T>(req: GenRequest): Promise<GenResponse<T>> {
    const res = await this.generateText(req);
    // Qwen Audio might return plain text, simple parse attempt
    try {
        return { ...res, data: JSON.parse(res.text) };
    } catch {
        return { ...res, data: {} as T };
    }
  }
}
