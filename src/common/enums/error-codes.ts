/**
 * 错误码枚举定义
 */

export enum ErrorCode {
  // 配置相关错误
  CONFIG_NOT_FOUND = 'CONFIG_001',
  CONFIG_INVALID = 'CONFIG_002',
  CONFIG_LOAD_FAILED = 'CONFIG_003',

  // AI 服务相关错误
  AI_PROVIDER_NOT_CONFIGURED = 'AI_001',
  AI_API_KEY_MISSING = 'AI_002',
  AI_REQUEST_TIMEOUT = 'AI_003',
  AI_RATE_LIMIT_EXCEEDED = 'AI_004',
  AI_SERVICE_UNAVAILABLE = 'AI_005',
  AI_INVALID_RESPONSE = 'AI_006',

  // 网络相关错误
  NETWORK_CONNECTION_FAILED = 'NET_001',
  NETWORK_TIMEOUT = 'NET_002',
  NETWORK_INVALID_URL = 'NET_003',

  // 文件系统相关错误
  FILE_NOT_FOUND = 'FS_001',
  FILE_ACCESS_DENIED = 'FS_002',
  FILE_PARSE_ERROR = 'FS_003',

  // 工作区相关错误
  WORKSPACE_NOT_FOUND = 'WS_001',
  WORKSPACE_ANALYSIS_FAILED = 'WS_002',

  // 内部错误
  INTERNAL_ERROR = 'INT_001',
  NOT_IMPLEMENTED = 'INT_002',
  INVALID_ARGUMENT = 'INT_003'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  details?: Record<string, any>;
}
