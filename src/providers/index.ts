/**
 * AI 服务统一导出入口
 * 
 * @remarks
 * 集中导出所有 AI 相关的类、接口和类型
 * 便于其他模块统一导入使用
 */

// 导出核心接口和类型
export type { AIProviderType, AICompletionRequest, AICompletionResponse, AIProviderConfig } from './provider';
export { AIProvider } from './provider';

// 导出具体实现类
export { OpenAIProvider } from './openai-provider';
export { AnthropicProvider } from './anthropic-provider';
export { GeminiProvider } from './gemini-provider';

// 导出工厂函数
export { createAIProvider } from './factory';

// 导出服务类
export { AIService } from './service';