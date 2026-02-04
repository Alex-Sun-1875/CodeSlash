import * as vscode from 'vscode';

export interface ExtensionConfiguration {
    enabled: boolean;
    apiProvider: string;
    apiKey: string;
    apiEndpoint: string;
    model: string;
    maxTokens: number;
    temperature: number;
    autoTrigger: boolean;
    debounceTime: number;
}

export class ConfigurationManager {
    private static instance: ConfigurationManager;
    private configuration: ExtensionConfiguration;
    private disposable: vscode.Disposable;

    private constructor() {
        this.configuration = this.loadConfiguration();
        
        this.disposable = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('code-slash')) {
                this.configuration = this.loadConfiguration();
            }
        });
    }

    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    private loadConfiguration(): ExtensionConfiguration {
        const config = vscode.workspace.getConfiguration('code-slash');
        
        return {
            enabled: config.get<boolean>('enabled', true),
            apiProvider: config.get<string>('apiProvider', 'ollama'),
            apiKey: config.get<string>('apiKey', ''),
            apiEndpoint: config.get<string>('apiEndpoint', 'https://api.openai.com/v1'),
            model: config.get<string>('model', 'gpt-4'),
            maxTokens: config.get<number>('maxTokens', 100),
            temperature: config.get<number>('temperature', 0.7),
            autoTrigger: config.get<boolean>('autoTrigger', true),
            debounceTime: config.get<number>('debounceTime', 300)
        };
    }

    public getConfiguration(): ExtensionConfiguration {
        return this.configuration;
    }

    public isEnabled(): boolean {
        return this.configuration.enabled;
    }

    public getApiKey(): string {
        return this.configuration.apiKey;
    }

    public getApiEndpoint(): string {
        return this.configuration.apiEndpoint;
    }

    public getProvider(): string {
        return this.configuration.apiProvider;
    }

    public getModel(): string {
        return this.configuration.model;
    }

    public getMaxTokens(): number {
        return this.configuration.maxTokens;
    }

    public getTemperature(): number {
        return this.configuration.temperature;
    }

    public isAutoTrigger(): boolean {
        return this.configuration.autoTrigger;
    }

    public getDebounceTime(): number {
        return this.configuration.debounceTime;
    }

    public updateConfiguration(key: string, value: any): Thenable<void> {
        const config = vscode.workspace.getConfiguration('code-slash');
        return config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    public dispose(): void {
        if (this.disposable) {
            this.disposable.dispose();
        }
    }
}

export const configManager = ConfigurationManager.getInstance();
