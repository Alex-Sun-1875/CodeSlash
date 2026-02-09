/**
 * 配置服务接口定义
 */

export interface ConfigSchema {
  // AI 相关配置
  ai: {
    provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'azure';
    apiKey: string;
    endpoint: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };

  // 补全相关配置
  completion: {
    enabled: boolean;
    autoTrigger: boolean;
    debounceTime: number;
    triggerCharacters: string[];
  };

  // 界面相关配置
  ui: {
    theme: 'auto' | 'light' | 'dark';
    showNotifications: boolean;
    animationEnabled: boolean;
  };

  // 高级配置
  advanced: {
    debugMode: boolean;
    cacheEnabled: boolean;
    cacheSize: number;
  };
}

export type ConfigKey = keyof ConfigSchema | `${keyof ConfigSchema}.${string}`;

export abstract class ConfigService {
  abstract get<T>(key: ConfigKey): T | undefined;
  abstract set<T>(key: ConfigKey, value: T): Promise<void>;
  abstract reset(): Promise<void>;
  abstract getAll(): ConfigSchema;
  abstract onChange(callback: (key: ConfigKey, newValue: any, oldValue: any) => void): () => void;
}
