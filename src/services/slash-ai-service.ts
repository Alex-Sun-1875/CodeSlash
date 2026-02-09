import * as vscode from 'vscode';
import { logger } from '../base/logging';

export type AIProvider = 'openai' | 'azure' | 'anthropic' | 'ollama';

export interface AICompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AICompletionResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export class AIService {
  private apiKey: string = '';
  private apiEndpoint: string = '';
  private provider: AIProvider = 'ollama';
  private model: string = 'qwen3-coder:30b';
  private maxTokens: number = 100;
  private temperature: number = 0.7;

  constructor() {
    this.loadConfiguration();
  }

  public loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('code-slash');
    this.apiKey = config.get<string>('apiKey', '');
    this.apiEndpoint = config.get<string>('apiEndpoint', 'https://api.openai.com/v1');
    this.provider = config.get<AIProvider>('apiProvider', 'openai');
    this.model = config.get<string>('model', 'gpt-4');
    this.maxTokens = config.get<number>('maxTokens', 100);
    this.temperature = config.get<number>('temperature', 0.7);
  }

  public async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey && this.provider !== 'ollama') {
      throw new Error('API key not configured. Please set code-slash.apiKey in settings.');
    }

    const prompt = request.prompt || this.buildPrompt(request.prompt);
    const maxTokens = request.maxTokens || this.maxTokens;
    const temperature = request.temperature || this.temperature;
    const model = request.model || this.model;

    try {
      switch (this.provider) {
        case 'openai':
          return await this.callOpenAI(model, prompt, maxTokens, temperature);
        case 'anthropic':
          return await this.callAnthropic(model, prompt, maxTokens, temperature);
        case 'azure':
          return await this.callAzure(model, prompt, maxTokens, temperature);
        case 'ollama':
          return await this.callOllama(model, prompt, maxTokens, temperature);
        default:
          return await this.callOpenAI(model, prompt, maxTokens, temperature);
      }
    } catch (error) {
      logger.error('AI Service Error:', error as Error);
      throw error;
    }
  }

  private async callOpenAI(
    model: string,
    prompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<AICompletionResponse> {
    const response = await fetch(this.apiEndpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content:
              'You are a code completion assistant. Provide concise, accurate code completions based on the context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    const completion = data.choices?.[0]?.message?.content || '';

    return {
      text: completion.trim(),
      usage: data.usage
    };
  }

  private async callAnthropic(
    model: string,
    prompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<AICompletionResponse> {
    const endpoint = this.apiEndpoint || 'https://api.anthropic.com/v1/complete';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API Error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();

    return {
      text: data.completion || '',
      usage: {
        promptTokens: data.prompt_tokens || 0,
        completionTokens: data.completion_tokens || 0
      }
    };
  }

  private async callAzure(
    model: string,
    prompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<AICompletionResponse> {
    const endpoint = this.apiEndpoint || process.env.AZURE_OPENAI_ENDPOINT || '';

    const response = await fetch(
      `${endpoint}/openai/deployments/${model}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'You are a code completion assistant. Provide concise, accurate code completions based on the context.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: temperature
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure API Error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    const completion = data.choices?.[0]?.message?.content || '';

    return {
      text: completion.trim(),
      usage: data.usage
    };
  }

  private async callOllama(
    model: string,
    prompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<AICompletionResponse> {
    const endpoint = this.apiEndpoint || 'http://localhost:11434/v1';

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'HnYZ9ct2NvXEwOS5Hjf0ePz1XUCFZGSfCuapTYU6e5A'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content:
              'You are a code completion assistant. Provide concise, accurate code completions based on the context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API Error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    const completion = data.choices?.[0]?.message?.content || '';

    return {
      text: completion.trim(),
      usage: data.usage
    };
  }

  private buildPrompt(context: string): string {
    return `Please complete the following code. Provide only the code completion without any explanations:\n\n${context}`;
  }

  public isConfigured(): boolean {
    if (this.provider === 'ollama') {
      return true;
    }
    return !!this.apiKey && !!this.apiEndpoint;
  }

  public async analyzeCodeForImports(code: string, language: string): Promise<string> {
    const prompt = `Analyze the following ${language} code and identify external module imports that might be missing. Return only the import statements, one per line, in the correct format.

Code:
${code}

Missing imports (or "NONE" if no missing imports detected):`;

    const response = await this.getCompletion({
      prompt,
      maxTokens: 200,
      temperature: 0.3
    });

    return response.text;
  }

  public async generateRefactoringSuggestion(code: string, context: string): Promise<string> {
    const prompt = `Analyze the following code and suggest improvements based on this context: "${context}"

Code:
${code}

Provide specific refactoring suggestions:`;

    const response = await this.getCompletion({
      prompt,
      maxTokens: 500,
      temperature: 0.5
    });

    return response.text;
  }

  public async explainCode(code: string): Promise<string> {
    const prompt = `Explain the following code in a clear, concise manner:

${code}

Explanation:`;

    const response = await this.getCompletion({
      prompt,
      maxTokens: 300,
      temperature: 0.5
    });

    return response.text;
  }

  public async generateDocumentation(code: string, language: string): Promise<string> {
    const prompt = `Generate documentation for the following ${language} code. Include:
- Brief description
- Parameters (if any)
- Return value (if any)
- Usage example

Code:
${code}

Documentation:`;

    const response = await this.getCompletion({
      prompt,
      maxTokens: 400,
      temperature: 0.5
    });

    return response.text;
  }
}

export const aiService = new AIService();
