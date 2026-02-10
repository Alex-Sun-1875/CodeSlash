/**
 * 服务模块统一导出入口
 *
 * @remarks
 * 集中导出所有服务模块，提供统一的访问接口
 */

// AI 服务
export * as ai from '@/providers';

// 日志服务
export * as logger from '@/base/logging';

// 配置服务
export * as config from '@/common/config';

// TODO: 工作区服务和补全服务待实现
// export * as workspace from './workspace';
// export * as completion from './completion';
