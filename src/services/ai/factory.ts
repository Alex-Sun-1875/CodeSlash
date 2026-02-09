/**
 * AI 提供商工厂函数
 *
 * @remarks
 * 根据配置动态创建对应的 AI 提供商实例
 */

import { AIProvider, AIProviderType, AIProviderConfig } from '../../providers/provider';
import { OpenAIProvider } from '../../providers/openai-provider';
import { AnthropicProvider } from '../../providers/anthropic-provider';
import { GeminiProvider } from '../../providers/gemini-provider';

export function createAIProvider(type: AIProviderType, config: AIProviderConfig): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'ollama':
      // TODO: 实现 Ollama 提供商
      throw new Error('Ollama provider not implemented yet');
    case 'azure':
      // TODO: 实现 Azure 提供商
      throw new Error('Azure provider not implemented yet');
    default:
      throw new Error(`Unsupported AI provider type: ${type}`);
  }
}
