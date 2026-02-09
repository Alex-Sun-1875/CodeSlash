/**
 * 日志服务工厂函数
 * 
 * @remarks
 * 根据环境和配置创建合适的日志实例
 */

import { Logger, LoggerConfig } from './logger.interface';
import { ConsoleLogger } from './console-logger';
import { VSCodeLogger } from './vscode-logger';

export type LoggerType = 'console' | 'vscode';

export function createLogger(type: LoggerType, config: LoggerConfig): Logger {
    switch (type) {
        case 'console':
            return new ConsoleLogger(config);
        case 'vscode':
            return new VSCodeLogger(config);
        default:
            throw new Error(`Unsupported logger type: ${type}`);
    }
}

// 默认配置
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
    level: 'info',
    prefix: 'CodeSlash',
    enableTimestamp: true
};