/**
 * Anthropic 服务提供商实现
 */

import { AIProvider, AICompletionRequest, AICompletionResponse, AIProviderConfig } from './provider';

export class AnthropicProvider extends AIProvider {
    constructor(config: AIProviderConfig) {
        super({
            ...config,
            endpoint: config.endpoint || 'https://api.anthropic.com/v1'
        });
    }

    async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
        if (!this.validateConfig()) {
            throw new Error('Invalid Anthropic configuration');
        }

        const startTime = Date.now();
        
        // TODO: 实现 Anthropic API 调用
        // 这里需要使用实际的 Anthropic SDK 或 API
        
        return {
            text: 'Anthropic completion result',
            responseTime: Date.now() - startTime
        };
    }

    async testConnection(): Promise<boolean> {
        // TODO: 实现连接测试
        return true;
    }

    getName(): string {
        return 'Anthropic';
    }
}