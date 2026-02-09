/**
 * AI 服务提供者接口定义
 *
 * @remarks
 * 定义所有 AI 提供商必须实现的标准接口
 * 支持多种 AI 服务的统一调用方式
 */

export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'azure';

export interface AICompletionRequest {
  /** 提示词内容 */
  prompt: string;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 温度参数 (0-2) */
  temperature?: number;
  /** 使用的模型 */
  model?: string;
  /** 系统提示词 */
  systemPrompt?: string;
}

export interface AICompletionResponse {
  /** 生成的文本内容 */
  text: string;
  /** 使用情况统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 响应时间（毫秒） */
  responseTime?: number;
}

export interface AIProviderConfig {
  /** API 密钥 */
  apiKey: string;
  /** API 端点 */
  endpoint: string;
  /** 默认模型 */
  defaultModel: string;
  /** 超时时间（毫秒） */
  timeout?: number;
}

export abstract class AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * 获取补全结果
   * @param request 补全请求
   */
  abstract getCompletion(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * 测试连接
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * 获取提供商名称
   */
  abstract getName(): string;

  /**
   * 验证配置
   */
  protected validateConfig(): boolean {
    return !!this.config.apiKey && !!this.config.endpoint;
  }

  /**
   * 构建请求头
   */
  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`
    };
  }
}
