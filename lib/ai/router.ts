import { AIProvider, ProviderType, TaskType, GenRequest, GenResponse } from './types';
import { GeminiProvider } from './providers/gemini';
import { OpenAICompatibleProvider } from './providers/openai-compat';
import { DoubaoProvider } from './providers/doubao';
import { QwenAudioProvider } from './providers/qwen-audio';
import { getSettings } from '../userSettings';

export class AIRouter {
  private providers: Map<ProviderType, AIProvider> = new Map();
  private circuitBreakerThreshold = 3;

  constructor() {
    this.refreshProviders();
  }

  public refreshProviders() {
    const settings = getSettings();
    const envKey = process.env.API_KEY;

    this.providers.clear();

    // 1. Gemini
    const geminiCfg = settings.providers.gemini;
    if (geminiCfg.enabled && (geminiCfg.apiKey || envKey)) {
      this.providers.set('gemini', new GeminiProvider(
        geminiCfg.apiKey || envKey || '',
        geminiCfg.model // Pass model from settings
      ));
    }

    // 2. DeepSeek (Strict)
    const ds = settings.providers.deepseek;
    if (ds.enabled && ds.apiKey) {
      this.providers.set('deepseek', new OpenAICompatibleProvider(
        'deepseek', ds.baseUrl, ds.apiKey, ds.model
      ));
    }

    // 3. Qwen Text (OpenAI Compat)
    const qt = settings.providers.qwenText;
    if (qt.enabled && qt.apiKey) {
      this.providers.set('qwen-text', new OpenAICompatibleProvider(
        'qwen-text', qt.baseUrl, qt.apiKey, qt.model
      ));
    }

    // 4. Qwen Audio (Native)
    const qa = settings.providers.qwenAudio;
    if (qa.enabled && qa.apiKey) {
      this.providers.set('qwen-audio', new QwenAudioProvider(qa));
    }

    // 5. Doubao (TTS Only)
    const db = settings.providers.doubao;
    if (db.enabled) {
      this.providers.set('doubao', new DoubaoProvider(db));
    }

    // 6. NewAPI (Fallback)
    const na = settings.providers.newapi;
    if (na.enabled && na.apiKey) {
      this.providers.set('newapi', new OpenAICompatibleProvider(
        'newapi', na.baseUrl, na.apiKey, na.model
      ));
    }
  }

  private getPriorityQueue(task: TaskType): ProviderType[] {
    const settings = getSettings();
    let preferred: ProviderType | undefined;

    // Map Task to Routing Config
    if (task === 'speech_tts') preferred = settings.modelRouting.speech_tts;
    else if (task === 'audio_understanding') preferred = settings.modelRouting.audio_understanding;
    else if (task === 'translation') preferred = settings.modelRouting.translation;
    else if (task === 'explanation') preferred = settings.modelRouting.explanation;
    else if (task === 'rewriting') preferred = settings.modelRouting.rewriting;
    
    const queue: ProviderType[] = [];
    if (preferred) queue.push(preferred);

    // Standard Fallbacks
    const defaults: ProviderType[] = ['gemini', 'deepseek', 'qwen-text', 'newapi'];
    
    // Check if NewAPI is configured as global fallback
    if (settings.providers.newapi.enabled && settings.providers.newapi.isFallback) {
         defaults.push('newapi');
    }

    // Add defaults if not already in queue
    defaults.forEach(p => {
        if (!queue.includes(p)) queue.push(p);
    });

    return queue;
  }

  async dispatch<T>(task: TaskType, req: GenRequest, isJson: boolean, forceProvider?: ProviderType): Promise<GenResponse<T>> {
    this.refreshProviders();

    // Special handling for TTS
    if (task === 'speech_tts') {
        const providerName = this.getPriorityQueue(task)[0];
        const provider = this.providers.get(providerName);
        if (!provider || !provider.synthesizeSpeech) {
             throw new Error("Selected provider does not support Speech Synthesis");
        }
        throw new Error("Use synthesizeSpeech() for TTS tasks");
    }

    // If a specific provider is forced (e.g., for import analysis)
    if (forceProvider) {
        const provider = this.providers.get(forceProvider);
        if (!provider) throw new Error(`Forced provider '${forceProvider}' is not configured or disabled.`);
        try {
            const result = isJson 
              ? await provider.generateJson<T>(req) 
              : await provider.generateText(req) as any;
            return result;
        } catch (error) {
            console.error(`[Router] Forced provider ${forceProvider} failed:`, error);
            throw error;
        }
    }

    const queue = this.getPriorityQueue(task);
    let lastError: any = null;

    for (const providerName of queue) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isHealthy()) continue;

      try {
        const result = isJson 
          ? await provider.generateJson<T>(req) 
          : await provider.generateText(req) as any;
        return result;
      } catch (error) {
        console.warn(`[Router] ${providerName} failed:`, error);
        lastError = error;
      }
    }
    throw new Error(`All providers failed. Last: ${(lastError as Error)?.message}`);
  }

  // Specialized method for TTS
  async synthesize(text: string): Promise<ArrayBuffer> {
      this.refreshProviders();
      const settings = getSettings();
      const providerName = settings.modelRouting.speech_tts;
      const provider = this.providers.get(providerName);

      if (provider && provider.synthesizeSpeech && provider.isHealthy()) {
          return await provider.synthesizeSpeech(text);
      }
      throw new Error(`TTS Provider ${providerName} not available or unhealthy.`);
  }
}

export const aiRouter = new AIRouter();
