/**
 * 日志服务接口定义
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export abstract class Logger {
  protected config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  abstract debug(message: string, metadata?: Record<string, any>): void;
  abstract info(message: string, metadata?: Record<string, any>): void;
  abstract warn(message: string, metadata?: Record<string, any>): void;
  abstract error(message: string, error?: Error, metadata?: Record<string, any>): void;

  abstract setLevel(level: LogLevel): void;
  abstract setPrefix(prefix: string): void;
}
