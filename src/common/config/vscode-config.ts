/**
 * VSCode 配置服务实现
 */

import * as vscode from 'vscode';
import { ConfigService, ConfigSchema, ConfigKey } from './config';

export class VSCodeConfigService extends ConfigService {
  private disposables: vscode.Disposable[] = [];
  private callbacks: Array<(key: ConfigKey, newValue: any, oldValue: any) => void> = [];

  constructor() {
    super();
    this.setupWatcher();
  }

  get<T>(key: ConfigKey): T | undefined {
    const config = vscode.workspace.getConfiguration('code-slash');
    return config.get(key as string) as T | undefined;
  }

  async set<T>(key: ConfigKey, value: T): Promise<void> {
    const config = vscode.workspace.getConfiguration('code-slash');
    await config.update(key as string, value, vscode.ConfigurationTarget.Global);
  }

  async reset(): Promise<void> {
    const config = vscode.workspace.getConfiguration('code-slash');
    const keys = Object.keys(this.getAll());

    for (const key of keys) {
      await config.update(key, undefined, vscode.ConfigurationTarget.Global);
    }
  }

  getAll(): ConfigSchema {
    const config = vscode.workspace.getConfiguration('code-slash');
    return {
      ai: {
        provider: config.get('ai.provider') || 'ollama',
        apiKey: config.get('ai.apiKey') || '',
        endpoint: config.get('ai.endpoint') || '',
        model: config.get('ai.model') || 'gpt-4',
        maxTokens: config.get('ai.maxTokens') || 100,
        temperature: config.get('ai.temperature') || 0.7
      },
      completion: {
        enabled: config.get('completion.enabled') ?? true,
        autoTrigger: config.get('completion.autoTrigger') ?? true,
        debounceTime: config.get('completion.debounceTime') || 300,
        triggerCharacters: config.get('completion.triggerCharacters') || ['.']
      },
      ui: {
        theme: config.get('ui.theme') || 'auto',
        showNotifications: config.get('ui.showNotifications') ?? true,
        animationEnabled: config.get('ui.animationEnabled') ?? true
      },
      advanced: {
        debugMode: config.get('advanced.debugMode') ?? false,
        cacheEnabled: config.get('advanced.cacheEnabled') ?? true,
        cacheSize: config.get('advanced.cacheSize') || 100
      }
    };
  }

  onChange(callback: (key: ConfigKey, newValue: any, oldValue: any) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  private setupWatcher(): void {
    const watcher = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('code-slash')) {
        // 这里可以触发回调，但需要知道具体的变化
        this.callbacks.forEach(cb => cb('unknown' as ConfigKey, null, null));
      }
    });

    this.disposables.push(watcher);
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.callbacks = [];
  }
}
