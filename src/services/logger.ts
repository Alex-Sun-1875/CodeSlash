export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
    private static instance: Logger;
    private prefix: string = '[code-slash]';
    private level: LogLevel = 'info';

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setPrefix(prefix: string): void {
        this.prefix = prefix;
    }

    public setLevel(level: LogLevel): void {
        this.level = level;
    }

    public debug(message: string, ...args: any[]): void {
        if (this.shouldLog('debug')) {
            console.debug(`${this.prefix} ${message}`, ...args);
        }
    }

    public info(message: string, ...args: any[]): void {
        if (this.shouldLog('info')) {
            console.log(`${this.prefix} ${message}`, ...args);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn(`${this.prefix} ${message}`, ...args);
        }
    }

    public error(message: string, ...args: any[]): void {
        if (this.shouldLog('error')) {
            console.error(`${this.prefix} ${message}`, ...args);
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
}

export const logger = Logger.getInstance();
