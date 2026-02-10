/**
 * AI 主服务类
 *
 * @remarks
 * 统一管理所有 AI 相关功能，提供高层次的 API 接口
 */

import {
  AIProvider,
  AIProviderType,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderConfig
} from '@/providers/provider';
import { createAIProvider } from './factory';

export class AIService {
  private provider: AIProvider | null = null;
  private currentProviderType: AIProviderType | null = null;

  /**
   * 配置 AI 提供商
   * @param type 提供商类型
   * @param config 配置信息
   */
  public configureProvider(type: AIProviderType, config: AIProviderConfig): void {
    this.provider = createAIProvider(type, config);
    this.currentProviderType = type;
  }

  /**
   * 获取补全结果
   * @param request 补全请求
   */
  public async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.provider) {
      throw new Error('AI provider not configured. Please call configureProvider first.');
    }

    return await this.provider.getCompletion(request);
  }

  /**
   * 测试当前配置的连接
   */
  public async testConnection(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    return await this.provider.testConnection();
  }

  /**
   * 获取当前提供商名称
   */
  public getCurrentProviderName(): string | null {
    return this.provider?.getName() || null;
  }

  /**
   * 检查是否已配置
   */
  public isConfigured(): boolean {
    return this.provider !== null;
  }

  /**
   * 获取支持的提供商列表
   */
  public getSupportedProviders(): AIProviderType[] {
    return ['openai', 'anthropic', 'gemini', 'ollama', 'azure'];
  }
}
