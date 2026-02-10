/**
 * AI 服务相关提示词
 */
export const AI_PROMPTS = {
  SYSTEM: '你是一个代码补全助手。基于上下文提供简洁准确的代码补全。',

  BUILD_COMPLETION: (context: string) =>
    `请补全以下代码。仅提供代码补全，不要包含任何解释：\n\n${context}`,

  ANALYZE_IMPORTS: (code: string, language: string) =>
    `分析以下 ${language} 代码并识别可能缺失的外部模块导入。仅返回导入语句，每行一个，格式正确。

代码：
${code}

缺失的导入（如果没有检测到缺失导入则返回 "NONE"）：`,

  REFACTOR_SUGGESTION: (code: string, context: string) =>
    `分析以下代码并基于上下文 "${context}" 提出改进建议：

代码：
${code}

提供具体的重构建议：`,

  EXPLAIN_CODE: (code: string) =>
    `用清晰简洁的语言解释以下代码：

${code}

解释：`,

  GENERATE_DOCS: (code: string, language: string) =>
    `为以下 ${language} 代码生成文档。包含：
- 简要描述
- 参数说明（如有）
- 返回值（如有）
- 使用示例

代码：
${code}

文档：`
};

/**
 * 内联补全相关提示词
 */
export const INLINE_COMPLETION_PROMPTS = {
  BUILD_PROMPT: (codeContext: string) =>
    `补全以下代码。仅提供下一行或几行代码，不要包含任何解释或 Markdown 格式：

${codeContext}

补全代码：`
};

/**
 * 智能导入相关提示词
 */
export const SMART_IMPORT_PROMPTS = {
  DETECT_IMPORTS: (code: string, language: string, symbols: string[]) =>
    `分析以下 ${language} 代码，并识别列表 "${symbols.join(', ')}" 中哪些符号可能导入自外部模块或包。

当前文件类型：${language}
代码片段：
${code}

对于每个看似来自外部源的符号，请按以下格式提供导入语句：
SYMBOL:导入语句

例如：
React:import React from 'react'
useState:import { useState } from 'react'
lodash:import _ from 'lodash'

仅返回确信为外部导入的符号。如果不确定，请勿包含该符号。`
};
