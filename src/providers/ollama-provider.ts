/**
 * Ollama 服务提供商实现 - 使用 OpenAI SDK 兼容模式
 */

import OpenAI from 'openai';
import {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig
} from './provider';

export class OllamaProvider extends AIProvider {
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      endpoint: config.endpoint || 'http://localhost:11434/v1'
    });

    this.client = new OpenAI({
      apiKey: 'ollama', // Ollama 不需要 API key，但 OpenAI SDK 需要
      baseURL: this.config.endpoint,
      timeout: this.config.timeout || 30000
    });
  }

  async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Ollama configuration');
    }

    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: request.model || this.config.defaultModel,
        messages: [
          ...(request.systemPrompt
            ? [
                {
                  role: 'system' as const,
                  content: request.systemPrompt
                }
              ]
            : []),
          {
            role: 'user' as const,
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false
      });

      const completion = response.choices?.[0]?.message?.content || '';

      // Ollama 的 usage 信息可能不完整，需要特殊处理
      const usage = response.usage;

      return {
        text: completion.trim(),
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens || 0,
              completionTokens: usage.completion_tokens || 0,
              totalTokens: usage.total_tokens || 0
            }
          : undefined,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Ollama API Error: ${(error as Error).message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'Ollama';
  }
}
