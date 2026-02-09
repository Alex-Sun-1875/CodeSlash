/**
 * AI 提供商工厂函数
 *
 * @remarks
 * 根据配置动态创建对应的 AI 提供商实例
 */

import { AIProvider, AIProviderType, AIProviderConfig } from './provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { OllamaProvider } from './ollama-provider';
import { AzureOpenAIProvider } from './azure-provider';
import { GeminiProvider } from './gemini-provider';

export function createAIProvider(type: AIProviderType, config: AIProviderConfig): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    case 'azure':
      return new AzureOpenAIProvider(config);
    default:
      throw new Error(`Unsupported AI provider type: ${type}`);
  }
}
