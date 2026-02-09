/**
 * 日志服务统一导出入口
 * 
 * @remarks
 * 集中导出所有日志相关的类、接口和类型
 * 便于其他模块统一导入使用
 */

// 导出核心接口和类型
export type { LogLevel, LoggerConfig, LogEntry } from './logger.interface';
export { Logger } from './logger.interface';

// 导出具体实现类
export { ConsoleLogger } from './console-logger';
export { VSCodeLogger } from './vscode-logger';

// 导出工厂函数
export { createLogger, DEFAULT_LOGGER_CONFIG } from './logger.factory';

// 导出单例实例
export { logger } from './logger.instance';