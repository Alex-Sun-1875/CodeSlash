/**
 * Anthropic 服务提供商实现 - 使用官方 SDK
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig
} from './provider';

export class AnthropicProvider extends AIProvider {
  private client: Anthropic;

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      endpoint: config.endpoint || 'https://api.anthropic.com'
    });

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.endpoint,
      timeout: this.config.timeout || 30000
    });
  }

  async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Anthropic configuration');
    }

    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: request.model || this.config.defaultModel,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ]
      });

      const completion = response.content[0].type === 'text' ? response.content[0].text : '';
      const usage = response.usage;

      return {
        text: completion.trim(),
        usage: usage
          ? {
              promptTokens: usage.input_tokens,
              completionTokens: usage.output_tokens,
              totalTokens: usage.input_tokens + usage.output_tokens
            }
          : undefined,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Anthropic API Error: ${(error as Error).message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Anthropic 没有直接的测试连接 API，发送一个简单的请求
      await this.client.messages.create({
        model: this.config.defaultModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'Anthropic';
  }
}
