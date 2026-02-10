import * as vscode from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableConsole?: boolean;
}

export class Logger {
  private outputChannel: vscode.OutputChannel;
  private config: LoggerConfig;

  constructor(config: LoggerConfig, channelName: string = 'Code Slash') {
    this.config = config;
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  public debug(message: string, metadata?: any): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, metadata);
    }
  }

  public info(message: string, metadata?: any): void {
    if (this.shouldLog('info')) {
      this.log('info', message, metadata);
    }
  }

  public warn(message: string, metadata?: any): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, metadata);
    }
  }

  public error(message: string, error?: Error, metadata?: any): void {
    if (this.shouldLog('error')) {
      this.log('error', message, metadata, error);
    }
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  public show(): void {
    this.outputChannel.show();
  }

  public hide(): void {
    this.outputChannel.hide();
  }

  public clear(): void {
    this.outputChannel.clear();
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  private log(level: LogLevel, message: string, metadata?: any, error?: Error): void {
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

    this.outputChannel.appendLine(output.trim());

    if (this.config.enableConsole) {
      const consoleArgs: any[] = [output.trim()];
      if (metadata) {
        consoleArgs.push(metadata);
      }
      if (error) {
        consoleArgs.push(error);
      }

      switch (level) {
        case 'debug':
          console.debug(...consoleArgs);
          break;
        case 'info':
          console.info(...consoleArgs);
          break;
        case 'warn':
          console.warn(...consoleArgs);
          break;
        case 'error':
          console.error(...consoleArgs);
          break;
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }
}

export const logger = new Logger({
  level: 'info',
  prefix: 'CodeSlash',
  enableTimestamp: true,
  enableConsole: true
});
