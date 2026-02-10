import * as vscode from 'vscode';
import { logger } from '@/base/logging';
import { AI_PROMPTS } from '@/common/prompt';
import {
  AIProvider,
  createAIProvider,
  AIProviderType,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse
} from '@/providers';

export class SlashAiService {
  private provider: AIProvider | null = null;
  private providerType: AIProviderType = 'openai';
  private config: AIProviderConfig = {
    apiKey: '',
    endpoint: '',
    defaultModel: 'qwen3-coder:30b'
  };

  constructor() {
    this.loadConfiguration();
  }

  public loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('code-slash');
    const type = config.get<string>('apiProvider', 'ollama') as AIProviderType; // Default to ollama

    this.providerType = type;
    this.config = {
      apiKey: config.get<string>('apiKey', '') || (type === 'ollama' ? 'ollama' : ''), // Ensure apiKey is set for Ollama
      endpoint: config.get<string>('apiEndpoint', ''),
      defaultModel: config.get<string>('model', 'qwen2.5-coder:7b'),
      timeout: config.get<number>('timeout', 30000)
    };

    // Special handling for Ollama default endpoint if not set or if default OpenAI
    if (this.providerType === 'ollama') {
      if (!this.config.endpoint || this.config.endpoint.includes('api.openai.com')) {
        this.config.endpoint = 'http://localhost:11434/v1';
      }
    }

    try {
      this.provider = createAIProvider(this.providerType, this.config);
      logger.info(`AI Provider switched to: ${this.provider.getName()}`);
    } catch (error) {
      logger.error('Failed to create AI provider:', error as Error);
      this.provider = null;
    }
  }

  public async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.provider) {
      throw new Error('AI Provider not initialized');
    }

    // Ensure system prompt is set
    const finalRequest: AICompletionRequest = {
      ...request,
      systemPrompt: request.systemPrompt || AI_PROMPTS.SYSTEM,
      // Use config default if not specified
      model: request.model || this.config.defaultModel,
      maxTokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7
    };

    try {
      return await this.provider.getCompletion(finalRequest);
    } catch (error) {
      logger.error('AI Service Error:', error as Error);
      throw error;
    }
  }

  public isConfigured(): boolean {
    if (this.providerType === 'ollama') {
      return true;
    }
    return !!this.config.apiKey;
  }

  public async analyzeCodeForImports(code: string, language: string): Promise<string> {
    const prompt = AI_PROMPTS.ANALYZE_IMPORTS(code, language);

    const response = await this.getCompletion({
      prompt,
      maxTokens: 200,
      temperature: 0.3
    });

    return response.text;
  }

  public async generateRefactoringSuggestion(code: string, context: string): Promise<string> {
    const prompt = AI_PROMPTS.REFACTOR_SUGGESTION(code, context);

    const response = await this.getCompletion({
      prompt,
      maxTokens: 500,
      temperature: 0.5
    });

    return response.text;
  }

  public async explainCode(code: string): Promise<string> {
    const prompt = AI_PROMPTS.EXPLAIN_CODE(code);

    const response = await this.getCompletion({
      prompt,
      maxTokens: 300,
      temperature: 0.5
    });

    return response.text;
  }

  public async generateDocumentation(code: string, language: string): Promise<string> {
    const prompt = AI_PROMPTS.GENERATE_DOCS(code, language);

    const response = await this.getCompletion({
      prompt,
      maxTokens: 400,
      temperature: 0.5
    });

    return response.text;
  }

  public async testConnection(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }
    return await this.provider.testConnection();
  }
}

export const slashAiService = new SlashAiService();
