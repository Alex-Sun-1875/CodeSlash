/**
 * VSCode 输出通道日志实现
 */

import * as vscode from 'vscode';
import { Logger, LoggerConfig, LogLevel } from './logger.interface';

export class VSCodeLogger extends Logger {
  private outputChannel: vscode.OutputChannel;

  constructor(config: LoggerConfig, channelName: string = 'Code Slash') {
    super(config);
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, metadata);
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      this.log('info', message, metadata);
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, metadata);
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      this.log('error', message, metadata, error);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  show(): void {
    this.outputChannel.show();
  }

  hide(): void {
    this.outputChannel.hide();
  }

  clear(): void {
    this.outputChannel.clear();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    const timestamp = this.config.enableTimestamp ? new Date().toISOString() : '';
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const levelStr = level.toUpperCase().padEnd(7);

    let output = `${timestamp} ${prefix} ${levelStr} ${message}`;

    if (metadata) {
      output += ` ${JSON.stringify(metadata)}`;
    }

    if (error) {
      output += `\nError: ${error.message}`;
      if (error.stack) {
        output += `\nStack: ${error.stack}`;
      }
    }

    this.outputChannel.appendLine(output);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }
}
