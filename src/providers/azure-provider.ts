/**
 * Azure OpenAI 服务提供商实现 - 使用官方 SDK
 */

import OpenAI from 'openai';
import {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig
} from './provider';

export class AzureOpenAIProvider extends AIProvider {
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      endpoint: config.endpoint // Azure 需要完整的端点 URL
    });

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.endpoint,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      timeout: this.config.timeout || 30000
    });
  }

  async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.validateConfig()) {
      throw new Error('Invalid Azure OpenAI configuration');
    }

    const startTime = Date.now();

    try {
      // Azure 使用部署名称而不是模型名称
      const deploymentName = request.model || this.config.defaultModel;

      const response = await this.client.chat.completions.create({
        model: deploymentName,
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
        temperature: request.temperature
      });

      const completion = response.choices?.[0]?.message?.content || '';
      const usage = response.usage;

      return {
        text: completion.trim(),
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens
            }
          : undefined,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Azure OpenAI API Error: ${(error as Error).message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Azure 没有直接的测试 API，尝试列出部署
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'Azure OpenAI';
  }
}
