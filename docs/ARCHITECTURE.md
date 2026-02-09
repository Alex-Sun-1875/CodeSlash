# Code Slash AI 架构设计文档

## 1. 整体架构原则

### 1.1 设计哲学

- **单一职责原则**：每个模块只负责一个核心功能
- **开闭原则**：对扩展开放，对修改封闭
- **依赖倒置原则**：依赖抽象而非具体实现
- **接口隔离原则**：细化接口，避免胖接口

### 1.2 代码组织原则

- **分层架构**：清晰的层次划分，降低耦合度
- **统一导出**：每个模块通过 `index.ts` 统一导出
- **绝对路径导入**：使用 `@` 前缀进行模块间导入
- **类型安全**：完整的 TypeScript 类型定义

## 2. 目录结构规范

### 2.1 src/base/ - 基础设施层

**职责**：存放所有基础工具类和核心基础设施

**包含内容**：

- 日志系统 (`logging/`)
- 工具函数 (`utils/`)
- 核心抽象类和接口
- 基础数据结构

**示例结构**：

```
src/base/
├── logging/           # 日志服务
│   ├── index.ts
│   ├── logger.interface.ts
│   ├── logger.factory.ts
│   ├── logger.instance.ts
│   ├── console-logger.ts
│   └── vscode-logger.ts
├── utils/             # 通用工具函数
│   ├── index.ts
│   ├── string-utils.ts
│   ├── array-utils.ts
│   └── validation-utils.ts
└── index.ts           # 基础设施统一导出
```

### 2.2 src/common/ - 公共资源层

**职责**：存放共享的常量、配置和静态资源

**包含内容**：

- 配置管理 (`config/`)
- 提示词模板 (`prompt/`)
- 常量定义 (`constants/`)
- 枚举类型 (`enums/`)

**示例结构**：

```
src/common/
├── config/            # 配置管理
│   ├── index.ts
│   ├── configuration.ts
│   └── config.schema.ts
├── prompt/            # AI 提示词模板
│   ├── index.ts
│   ├── completion-prompts.ts
│   ├── analysis-prompts.ts
│   └── refactoring-prompts.ts
├── constants/         # 常量定义
│   ├── index.ts
│   ├── app-constants.ts
│   └── error-codes.ts
└── index.ts           # 公共资源统一导出
```

### 2.3 src/providers/ - AI 服务提供者层

**职责**：实现各种 AI 服务的具体接口调用

**包含内容**：

- AI 提供商实现 (`*-provider.ts`)
- 抽象基类 (`provider.ts`)
- 工厂模式实现
- 统一接口定义

**SDK 技术选型规范**：

- **Anthropic Provider**：必须使用 `@anthropic-ai/sdk` 官方库
- **其他 Provider**：统一使用 `openai` 官方 SDK（包括 OpenAI、Ollama、Azure OpenAI）
- **禁止使用**：原生 fetch 请求或其他第三方封装
- **兼容性考虑**：Ollama 使用 OpenAI SDK 的兼容模式

**示例结构**：

```
src/providers/
├── provider.ts        # AI 提供商抽象基类
├── openai-provider.ts # OpenAI 实现（使用 openai SDK）
├── anthropic-provider.ts # Anthropic 实现（使用 @anthropic-ai/sdk）
├── gemini-provider.ts # Gemini 实现
├── ollama-provider.ts # Ollama 实现（使用 openai SDK 兼容模式）
├── azure-provider.ts  # Azure OpenAI 实现（使用 openai SDK）
├── factory.ts         # 提供商工厂
└── index.ts           # 提供者统一导出
```

### 2.4 src/services/ - 业务服务层

**职责**：实现具体的业务逻辑和功能模块

**包含内容**：

- AI 核心服务 (`ai/`)
- 代码补全服务 (`completion/`)
- 智能导入服务 (`smart-import/`)
- 工作区分析服务 (`workspace/`)
- 其他业务服务

**示例结构**：

```
src/services/
├── ai/                # AI 核心服务
│   ├── index.ts
│   ├── ai-service.ts
│   └── ai-manager.ts
├── completion/        # 代码补全服务
│   ├── index.ts
│   ├── inline-completion-provider.ts
│   └── completion-engine.ts
├── smart-import/      # 智能导入服务
│   ├── index.ts
│   ├── smart-importer.ts
│   └── import-analyzer.ts
├── workspace/         # 工作区服务
│   ├── index.ts
│   ├── workspace-analyzer.ts
│   └── file-watcher.ts
└── index.ts           # 业务服务统一导出
```

## 3. 导入规范

### 3.1 绝对路径导入

使用 `@` 前缀进行模块间导入，避免相对路径：

```typescript
// ✅ 正确方式
import { logger } from '@/base/logging';
import { CONFIG } from '@/common/config';
import { OpenAIProvider } from '@/providers';
import { AIService } from '@/services/ai';

// ❌ 避免使用相对路径
import { logger } from '../../../base/logging';
```

### 3.2 导入顺序

按照以下顺序组织导入语句：

1. 外部依赖（第三方库）
2. 内部模块（使用 @ 前缀）
3. 相对导入（仅在同一模块内）

```typescript
// 外部依赖
import * as vscode from 'vscode';
import { inject, injectable } from 'inversify';

// 内部模块
import { logger } from '@/base/logging';
import { CONFIG } from '@/common/config';
import { OpenAIProvider } from '@/providers';

// 相对导入（同一模块内）
import { HelperClass } from './helper';
```

## 4. 编码规范

### 4.1 文件命名规范

- 使用 kebab-case 命名文件：`ai-service.ts`
- 接口文件使用 `.interface.ts` 后缀
- 实现文件使用具体功能命名
- 索引文件统一命名为 `index.ts`

### 4.2 类和接口命名

- 类名使用 PascalCase：`AIService`
- 接口名使用 PascalCase 并加 `I` 前缀：`ILogger`
- 抽象类使用 `Base` 或 `Abstract` 前缀：`BaseProvider`

### 4.3 导出规范

每个模块目录必须包含 `index.ts` 文件，统一导出该模块的所有公共接口：

```typescript
// src/base/logging/index.ts
export type { LogLevel, LoggerConfig } from './logger.interface';
export { Logger } from './logger.interface';
export { ConsoleLogger, VSCodeLogger } from './logger.implementations';
export { createLogger } from './logger.factory';
export { logger } from './logger.instance';
```

### 4.4 AI Provider 实现规范

所有 AI Provider 实现必须遵循以下规范：

1. **SDK 使用规范**：
   - Anthropic Provider 必须使用 `@anthropic-ai/sdk`
   - 其他 Provider 统一使用 `openai` 官方 SDK
   - 禁止使用原生 fetch 或其他第三方封装

2. **兼容性处理**：
   - Ollama Provider 使用 OpenAI SDK 的兼容模式
   - Azure OpenAI Provider 需要正确配置端点和认证

3. **错误处理**：
   - 统一的错误格式和消息
   - 适当的超时和重试机制
   - 详细的日志记录

## 5. 开发流程规范

### 5.1 代码质量检查

在编译运行前必须执行：

```bash
# 1. 代码格式化
npm run format

# 2. 代码检查
npm run lint

# 3. 类型检查
npm run check-types

# 4. 编译构建
npm run compile
```

**注意事项**：

- 确保所有 AI Provider 使用正确的官方 SDK
- Anthropic 必须使用 `@anthropic-ai/sdk`
- 其他 Provider 统一使用 `openai` SDK
- 避免使用原生 fetch 或其他封装

### 5.2 测试规范

- 每个服务模块都应包含对应的测试文件
- 测试文件命名：`*.test.ts`
- 测试覆盖率应达到 80% 以上

### 5.3 文档规范

- 公共接口必须添加 JSDoc 注释
- 复杂业务逻辑需要添加行内注释
- 重要设计决策需要在架构文档中记录

## 6. 部署和发布

### 6.1 版本管理

遵循语义化版本规范：

- MAJOR: 不兼容的 API 修改
- MINOR: 向后兼容的功能新增
- PATCH: 向后兼容的问题修复

### 6.2 发布流程

1. 更新版本号
2. 更新 CHANGELOG.md
3. 运行完整测试套件
4. 构建生产版本
5. 发布到 VS Code Marketplace

## 7. 性能优化建议

### 7.1 内存管理

- 及时清理事件监听器
- 合理使用单例模式
- 避免内存泄漏

### 7.2 性能监控

- 实现性能指标收集
- 设置合理的超时机制
- 优化 API 调用频率

---

_本文档将持续更新，反映项目的最新架构设计和最佳实践。_
