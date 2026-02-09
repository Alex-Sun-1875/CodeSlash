/**
 * 日志服务单例实例
 *
 * @remarks
 * 提供全局可用的日志实例
 */

import { Logger } from './logger.interface';
import { DEFAULT_LOGGER_CONFIG } from './logger.factory';
import { VSCodeLogger } from './vscode-logger';

// 创建默认的 VSCode 日志实例
export const logger: Logger = new VSCodeLogger(DEFAULT_LOGGER_CONFIG);
