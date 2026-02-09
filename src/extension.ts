import * as vscode from 'vscode';
import { aiService } from './services/slash-ai-service';
import { logger } from './base/logging';
import { configManager } from './common/config/configuration';
import { smartImport } from './services/smart-import/slash-smart-importer';
import { inlineCompletionProvider } from './services/completion/slash-inline-completion-provider';
import { workspaceAnalyzer } from './services/workspace/slash-workspace-analyzer';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logger.info('Extension is now active!');

  if (!aiService.isConfigured()) {
    const message = '请在设置中配置 API 密钥以启用 AI 补全功能。';
    logger.warn(message);
    vscode.window.showWarningMessage(message);
  } else {
    logger.info('AI 服务已配置，可以开始使用智能补全功能。');
  }

  const inlineCompletionRegistration = vscode.languages.registerInlineCompletionItemProvider(
    {
      scheme: 'file',
      language: '*'
    },
    inlineCompletionProvider
  );

  context.subscriptions.push(inlineCompletionRegistration);

  const insertCompletionCommand = vscode.commands.registerCommand(
    'code-slash.insertCompletion',
    async (completionText: string, position: vscode.Position) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await editor.edit(editBuilder => {
          editBuilder.insert(position, completionText);
        });
      }
    }
  );

  context.subscriptions.push(insertCompletionCommand);

  const showStatusCommand = vscode.commands.registerCommand('code-slash.showStatus', async () => {
    const config = configManager.getConfiguration();
    const isConfigured = aiService.isConfigured();

    const statusMessage = `
code-slash 状态:
- 启用状态: ${config.enabled ? '✅' : '❌'}
- API 提供商: ${config.apiProvider}
- 模型: ${config.model}
- API 配置: ${isConfigured ? '✅' : '❌'}
- 最大 Token: ${config.maxTokens}
- 温度: ${config.temperature}
        `.trim();

    await vscode.window.showInformationMessage(statusMessage, { modal: true });
  });

  context.subscriptions.push(showStatusCommand);

  const configureCommand = vscode.commands.registerCommand('code-slash.configure', async () => {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'code-slash');
  });

  context.subscriptions.push(configureCommand);

  const scanImportsCommand = vscode.commands.registerCommand('code-slash.scanImports', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await smartImport.scanDocument(editor.document);
    }
  });

  context.subscriptions.push(scanImportsCommand);

  const addImportCommand = vscode.commands.registerCommand(
    'code-slash.addImport',
    async (importStatement: string) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && importStatement) {
        await smartImport.addImport(importStatement, editor.document);
      }
    }
  );

  context.subscriptions.push(addImportCommand);

  const explainCodeCommand = vscode.commands.registerCommand('code-slash.explainCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
      vscode.window.showWarningMessage('请先选择要解释的代码');
      return;
    }

    try {
      const explanation = await aiService.explainCode(selection);
      const doc = await vscode.window.showQuickPick(
        explanation.split('\n').filter((line: string) => line.trim()),
        { title: 'Code Explanation', canPickMany: false }
      );
    } catch (error) {
      vscode.window.showErrorMessage('解释代码失败: ' + (error as Error).message);
    }
  });

  context.subscriptions.push(explainCodeCommand);

  const generateDocsCommand = vscode.commands.registerCommand(
    'code-slash.generateDocs',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage('请先选择要生成文档的代码');
        return;
      }

      try {
        const docs = await aiService.generateDocumentation(selection, editor.document.languageId);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(editor.document.uri, editor.selection.start, docs + '\n');
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage('文档已生成！');
      } catch (error) {
        vscode.window.showErrorMessage('生成文档失败: ' + (error as Error).message);
      }
    }
  );

  context.subscriptions.push(generateDocsCommand);

  const refactorCommand = vscode.commands.registerCommand('code-slash.refactor', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
      vscode.window.showWarningMessage('请先选择要重构的代码');
      return;
    }

    try {
      const suggestions = await aiService.generateRefactoringSuggestion(
        selection,
        'Improve this code'
      );

      const panel = vscode.window.createWebviewPanel(
        'codeSlashRefactor',
        'Refactoring Suggestions',
        vscode.ViewColumn.Beside,
        {}
      );

      panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <h2>重构建议</h2>
                    <pre>${suggestions.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </body>
                </html>
            `;
    } catch (error) {
      vscode.window.showErrorMessage('重构建议失败: ' + (error as Error).message);
    }
  });

  context.subscriptions.push(refactorCommand);

  const enableInlineCompletionCommand = vscode.commands.registerCommand(
    'code-slash.enableInlineCompletion',
    async () => {
      inlineCompletionProvider.setEnabled(true);
      vscode.window.showInformationMessage('内联补全已启用！');
    }
  );

  context.subscriptions.push(enableInlineCompletionCommand);

  const disableInlineCompletionCommand = vscode.commands.registerCommand(
    'code-slash.disableInlineCompletion',
    async () => {
      inlineCompletionProvider.setEnabled(false);
      vscode.window.showInformationMessage('内联补全已禁用！');
    }
  );

  context.subscriptions.push(disableInlineCompletionCommand);

  const acceptInlineCompletionCommand = vscode.commands.registerCommand(
    'code-slash.acceptInlineCompletion',
    async () => {
      await inlineCompletionProvider.acceptCompletion(new vscode.Position(0, 0));
    }
  );

  context.subscriptions.push(acceptInlineCompletionCommand);

  const onDidOpenTextDocument = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      smartImport.scanDocument(editor.document);
    }
  });

  context.subscriptions.push(onDidOpenTextDocument);

  if (vscode.window.activeTextEditor) {
    smartImport.scanDocument(vscode.window.activeTextEditor.document);
  }
}

export function deactivate(): void {
  logger.info('Extension is now deactivated.');

  inlineCompletionProvider.dispose();
  configManager.dispose();
  smartImport.dispose();
  inlineCompletionProvider.dispose();
  workspaceAnalyzer.dispose();
}
