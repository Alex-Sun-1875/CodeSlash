# Code Slash AI 代码风格规范

## 1. 代码格式化规范

### 1.1 Prettier 配置

项目使用 Prettier 进行代码格式化，配置如下：

```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 1.2 格式化规则说明

- **缩进**：使用 2 个空格代替 Tab
- **行宽限制**：每行最大长度不超过 100 字符
- **引号**：统一使用单引号
- **分号**：语句结尾必须加分号
- **尾随逗号**：对象和数组结尾不使用尾随逗号
- **括号间距**：对象字面量的大括号内部添加空格
- **箭头函数**：单参数箭头函数省略括号

### 1.3 格式化命令

```bash
# 格式化所有 TypeScript 文件和 Markdown 文档
npm run format

# 手动格式化特定文件
npx prettier --write src/**/*.ts
npx prettier --write docs/**/*.md
```

## 2. 代码质量检查流程

### 2.1 完整检查流程

在提交代码前，必须按顺序执行以下检查：

```bash
# 1. 类型检查
npm run check-types

# 2. 代码风格检查
npm run lint

# 3. 代码格式化
npm run format

# 4. 编译构建
npm run compile
```

### 2.2 自动化流程

项目已配置自动化流程，运行 `npm run compile` 会自动执行：

1. TypeScript 类型检查
2. ESLint 代码风格检查
3. Prettier 代码格式化
4. ESBuild 打包构建

## 3. AI Provider SDK 规范

### 3.1 SDK 技术选型

- **Anthropic Provider**：必须使用 `@anthropic-ai/sdk` 官方库
- **其他 Provider**：统一使用 `openai` 官方 SDK
  - OpenAI Provider
  - Ollama Provider（兼容模式）
  - Azure OpenAI Provider

### 3.2 禁止使用的实现方式

- ❌ 原生 fetch 请求
- ❌ 其他第三方封装库
- ❌ 手动构造 HTTP 请求

### 3.3 兼容性要求

- Ollama Provider 使用 OpenAI SDK 的兼容模式
- Azure OpenAI 需要正确配置端点和认证参数
- 所有 Provider 都需要实现统一的接口

## 4. 目录结构规范

### 4.1 分层架构

```
src/
├── base/              # 基础设施层（日志、工具函数）
├── common/            # 公共资源层（配置、常量、提示词）
├── providers/         # AI 服务提供者层
├── services/          # 业务服务层
└── extension.ts       # 扩展入口点
```

### 4.2 模块导出规范

- 每个模块目录必须包含 `index.ts` 文件
- 通过 `index.ts` 统一导出该模块的所有公共接口
- 使用绝对路径导入：`@/base/logging` 而非 `../../../base/logging`

## 5. 编码规范

### 5.1 命名规范

- **文件名**：使用 kebab-case（如 `ai-service.ts`）
- **类名**：使用 PascalCase（如 `AIService`）
- **接口名**：使用 PascalCase（如 `ILogger`）
- **变量名**：使用 camelCase（如 `userService`）

### 5.2 注释规范

- 公共接口必须添加 JSDoc 注释
- 复杂业务逻辑需要添加行内注释
- 重要设计决策需要在架构文档中记录

### 5.3 错误处理

- 统一的错误格式和消息
- 适当的超时和重试机制
- 详细的日志记录

## 6. 测试规范

### 6.1 测试要求

- 每个服务模块都应包含对应的测试文件
- 测试文件命名：`*.test.ts`
- 测试覆盖率应达到 80% 以上

### 6.2 测试命令

```bash
# 运行所有测试
npm test

# 编译测试文件
npm run compile-tests
```

## 7. 版本管理规范

### 7.1 语义化版本

- **MAJOR**：不兼容的 API 修改
- **MINOR**：向后兼容的功能新增
- **PATCH**：向后兼容的问题修复

### 7.2 发布流程

1. 更新版本号
2. 更新 CHANGELOG.md
3. 运行完整测试套件
4. 构建生产版本
5. 发布到 VS Code Marketplace

## 8. 性能优化规范

### 8.1 内存管理

- 及时清理事件监听器
- 合理使用单例模式
- 避免内存泄漏

### 8.2 性能监控

- 实现性能指标收集
- 设置合理的超时机制
- 优化 API 调用频率

---

_本文档与架构设计文档保持同步更新，确保开发规范的时效性和准确性。_
