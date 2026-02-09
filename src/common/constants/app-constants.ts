/**
 * 应用常量定义
 */

// 应用基本信息
export const APP_CONSTANTS = {
    NAME: 'Code Slash AI',
    VERSION: '0.0.1',
    DISPLAY_NAME: 'Code Slash AI',
    DESCRIPTION: 'AI-powered code completion extension for VS Code'
} as const;

// AI 相关常量
export const AI_CONSTANTS = {
    DEFAULT_MAX_TOKENS: 100,
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_DEBOUNCE_TIME: 300,
    MAX_CONTEXT_LENGTH: 2000,
    MIN_CONFIDENCE_THRESHOLD: 0.7
} as const;

// 日志相关常量
export const LOG_CONSTANTS = {
    DEFAULT_LOG_LEVEL: 'info' as const,
    LOG_PREFIX: '[CodeSlash]' as const,
    ENABLE_TIMESTAMP: true as const
} as const;

// 配置相关常量
export const CONFIG_CONSTANTS = {
    EXTENSION_NAME: 'code-slash',
    DEFAULT_PROVIDER: 'ollama' as const,
    DEFAULT_MODEL: 'qwen3-coder:30b' as const,
    SUPPORTED_PROVIDERS: ['openai', 'anthropic', 'gemini', 'ollama', 'azure'] as const
} as const;

// UI 相关常量
export const UI_CONSTANTS = {
    STATUS_BAR_PRIORITY: 100,
    QUICK_PICK_PLACEHOLDER: 'Select an option...',
    NOTIFICATION_TIMEOUT: 5000
} as const;