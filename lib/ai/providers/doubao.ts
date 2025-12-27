import { AIProvider, GenRequest, GenResponse } from '../types';
import { DoubaoConfig } from '../../userSettings';

export class DoubaoProvider implements AIProvider {
  public name = 'doubao' as const;
  private config: DoubaoConfig;
  
  constructor(config: DoubaoConfig) {
    this.config = config;
  }

  isHealthy() {
    // Requires AppID, AccessToken, and VoiceType
    return this.config.enabled && 
           !!this.config.appId && 
           !!this.config.accessToken && 
           !!this.config.voiceType;
  }

  async generateText(req: GenRequest): Promise<GenResponse<string>> {
    return {
        text: "[Doubao Provider is configured for TTS only]",
        provider: 'doubao'
    };
  }

  async generateJson<T>(req: GenRequest): Promise<GenResponse<T>> {
    throw new Error("Doubao Provider does not support JSON generation.");
  }

  // Strict implementation of Volcengine TTS API
  // Docs: https://www.volcengine.com/docs/6561/79823
  async synthesizeSpeech(text: string): Promise<ArrayBuffer> {
     if (!this.isHealthy()) throw new Error("Doubao TTS config missing (AppID/Token/Voice).");

     const reqId = crypto.randomUUID();
     
     // 1. Construct Endpoint
     // If Proxy is provided, use it. Otherwise direct.
     const baseUrl = this.config.proxyUrl 
        ? this.config.proxyUrl.replace(/\/$/, '') 
        : 'https://openspeech.bytedance.com';
     const url = `${baseUrl}/api/v1/tts`;

     // 2. Construct Headers (Strict Auth Format: "Bearer;token")
     const headers = {
        'Authorization': `Bearer;${this.config.accessToken}`,
        'Content-Type': 'application/json'
     };

     // 3. Construct Body
     const body = {
        app: {
            appid: this.config.appId,
            token: "access_token", // Field required by schema but usually ignored if Header is set, sticking to docs
            cluster: this.config.cluster || 'volcano_tts'
        },
        user: {
            uid: "echospeak_user"
        },
        audio: {
            voice_type: this.config.voiceType,
            encoding: "mp3",
            speed_ratio: 1.0,
            volume_ratio: 1.0,
            pitch_ratio: 1.0,
        },
        request: {
            reqid: reqId,
            text: text,
            text_type: "plain",
            operation: "query"
        }
     };

     console.log(`[Doubao TTS] Calling ${url} with Voice: ${this.config.voiceType}`);

     try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Volcengine TTS Error (${response.status}): ${errorText}`);
        }

        const json = await response.json();

        // Volcengine returns base64 in `data` field
        if (json.code !== 3000 && json.message !== "Success") {
             // 3000 is usually success code for this API, depends on version.
             // Sometimes it returns binary directly? No, documentation says "query" operation returns JSON with data.
             // Let's handle the specific JSON response format from Volcengine.
             // Format: { "code": 3000, "message": "Success", "data": "base64...", "trace_id": "..." }
             if (json.code && json.code !== 3000) {
                 throw new Error(`TTS API Error Code ${json.code}: ${json.message}`);
             }
        }

        if (!json.data) {
            throw new Error("TTS response missing 'data' field.");
        }

        // Decode Base64 to ArrayBuffer
        const binaryString = atob(json.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;

     } catch (e) {
         console.error("Doubao TTS Failed:", e);
         throw e;
     }
  }
}
