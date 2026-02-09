/**
 * OpenAI 服务提供商实现
 */

import { AIProvider, AICompletionRequest, AICompletionResponse, AIProviderConfig } from './provider';

export class OpenAIProvider extends AIProvider {
    constructor(config: AIProviderConfig) {
        super({
            ...config,
            endpoint: config.endpoint || 'https://api.openai.com/v1'
        });
    }

    async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
        if (!this.validateConfig()) {
            throw new Error('Invalid OpenAI configuration');
        }

        const startTime = Date.now();
        
        const response = await (global as any).fetch(`${this.config.endpoint}/chat/completions`, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify({
                model: request.model || this.config.defaultModel,
                messages: [
                    ...(request.systemPrompt ? [{
                        role: 'system',
                        content: request.systemPrompt
                    }] : []),
                    {
                        role: 'user',
                        content: request.prompt
                    }
                ],
                max_tokens: request.maxTokens,
                temperature: request.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.status} - ${await response.text()}`);
        }

        const data: any = await response.json();
        const completion = data.choices?.[0]?.message?.content || '';

        return {
            text: completion.trim(),
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            } : undefined,
            responseTime: Date.now() - startTime
        };
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await (global as any).fetch(`${this.config.endpoint}/models`, {
                headers: this.buildHeaders()
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    getName(): string {
        return 'OpenAI';
    }
}