// In a real application, these should be environment variables.
// We fall back to empty strings or defaults.

export const AI_CONFIG = {
  gemini: {
    apiKey: process.env.API_KEY || '', // Uses the main key provided by the system
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_KEY || '',
    model: 'deepseek-chat',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_KEY || '',
    model: 'qwen-plus',
  },
  newapi: {
    baseUrl: process.env.NEWAPI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.NEWAPI_KEY || '',
    model: 'gpt-3.5-turbo',
  }
};
