/**
 * 控制台日志实现
 */

import { Logger, LoggerConfig, LogLevel } from './logger.interface';

export class ConsoleLogger extends Logger {
    constructor(config: LoggerConfig) {
        super(config);
    }

    debug(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog('debug')) {
            // TODO: 实现控制台输出
            this.logInternal('debug', message, metadata);
        }
    }

    info(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog('info')) {
            // TODO: 实现控制台输出
            this.logInternal('info', message, metadata);
        }
    }

    warn(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog('warn')) {
            // TODO: 实现控制台输出
            this.logInternal('warn', message, metadata);
        }
    }

    error(message: string, error?: Error, metadata?: Record<string, any>): void {
        if (this.shouldLog('error')) {
            // TODO: 实现控制台输出
            this.logInternal('error', message, metadata, error);
        }
    }

    setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    setPrefix(prefix: string): void {
        this.config.prefix = prefix;
    }

    private logInternal(
        level: LogLevel,
        message: string,
        metadata?: Record<string, any>,
        error?: Error
    ): void {
        // 日志内部处理逻辑
        const timestamp = this.config.enableTimestamp ? 
            new Date().toISOString() : '';
        const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
        const levelStr = level.toUpperCase().padEnd(7);

        // 这里可以添加实际的日志输出实现
        // 暂时留空，后续可以根据环境选择合适的输出方式
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.config.level);
    }
}