import * as vscode from 'vscode';
import { aiService } from '../services/slash-ai-service';
import { logger } from '../base/logging';
import { configManager } from '../common/config/configuration';

export class CodeCompletionProvider implements vscode.CompletionItemProvider {
    private debounceTimer: NodeJS.Timeout | null = null;
    private lastRequestTime: number = 0;

    public async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionList | undefined> {
        if (!configManager.isEnabled()) {
            return undefined;
        }

        if (!aiService.isConfigured()) {
            logger.info('AI service not configured. Please set API key in settings.');
            return undefined;
        }

        const now = Date.now();
        const debounceTime = configManager.getDebounceTime();
        if (now - this.lastRequestTime < debounceTime) {
            return undefined;
        }

        try {
            const contextCode = this.extractContext(document, position);
            const prompt = this.buildPrompt(contextCode);

            const response = await aiService.getCompletion({ prompt });
            
            if (token.isCancellationRequested) {
                return undefined;
            }

            const completionItems = this.createCompletionItems(response.text, position);
            this.lastRequestTime = now;

            return new vscode.CompletionList(completionItems, false);
        } catch (error) {
            logger.error('Error getting AI completion:', error as Error);
            return undefined;
        }
    }

    private extractContext(document: vscode.TextDocument, position: vscode.Position): string {
        const startLine = Math.max(0, position.line - 20);
        const endLine = position.line;
        
        let context = '';
        
        for (let i = startLine; i <= endLine; i++) {
            const line = document.lineAt(i).text;
            context += line + '\n';
        }

        const currentLine = document.lineAt(position.line).text;
        const currentLinePrefix = currentLine.substring(0, position.character);
        context += currentLinePrefix;

        return context;
    }

    private buildPrompt(codeContext: string): string {
        return `请根据以下代码上下文完成代码，只返回完成的代码部分，不需要解释：\n\n${codeContext}\n\n请完成光标处的代码：`;
    }

    private createCompletionItems(completionText: string, position: vscode.Position): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        
        const lines = completionText.split('\n');
        let fullCompletion = '';
        
        for (const line of lines) {
            fullCompletion += line + '\n';
        }
        
        const trimmedCompletion = fullCompletion.trim();
        if (!trimmedCompletion) {
            return items;
        }

        const item = new vscode.CompletionItem(
            trimmedCompletion.split('\n')[0]?.substring(0, 50) + '...',
            vscode.CompletionItemKind.Snippet
        );

        item.detail = '🤖 AI 智能补全';
        item.documentation = new vscode.MarkdownString(trimmedCompletion);
        item.insertText = trimmedCompletion;
        item.range = new vscode.Range(position, position);
        
        item.filterText = trimmedCompletion;
        item.preselect = true;
        
        item.command = {
            command: 'code-slash.insertCompletion',
            title: 'Insert AI Completion',
            arguments: [trimmedCompletion, position]
        };

        items.push(item);

        const firstLine = trimmedCompletion.split('\n')[0];
        if (firstLine && firstLine.length > 3) {
            const shortItem = new vscode.CompletionItem(
                firstLine,
                vscode.CompletionItemKind.Snippet
            );
            shortItem.detail = '🤖 AI 智能补全 (短)';
            shortItem.documentation = new vscode.MarkdownString(trimmedCompletion);
            shortItem.insertText = firstLine;
            shortItem.range = new vscode.Range(position, position);
            
            items.push(shortItem);
        }

        return items;
    }

    public async resolveCompletionItem(
        item: vscode.CompletionItem,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem | undefined> {
        if (token.isCancellationRequested) {
            return undefined;
        }

        return item;
    }

    public dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
}

export const completionProvider = new CodeCompletionProvider();
