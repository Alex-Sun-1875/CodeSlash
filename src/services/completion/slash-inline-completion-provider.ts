import * as vscode from 'vscode';
import { slashAiService } from '@/services/slash-ai-service';
import { logger } from '@/base/logging';
import { configManager } from '@/common/config/configuration';
import { INLINE_COMPLETION_PROMPTS } from '@/common/prompt';

export class SlashInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private lastRequestTime: number = 0;
  private debounceTime: number = 300;
  private isEnabled: boolean = true;
  private statusBarItem: vscode.StatusBarItem;
  private isDisposed: boolean = false;
  private pendingTimeouts: NodeJS.Timeout[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.statusBarItem.text = 'Code Slash';
    this.statusBarItem.tooltip = 'AI Inline Completion';
    this.statusBarItem.show();

    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    const config = configManager.getConfiguration();
    this.isEnabled = config.enabled;
    this.debounceTime = config.debounceTime || 300;
  }

  public async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | undefined> {
    if (this.isDisposed || !this.isEnabled) {
      return undefined;
    }

    if (!slashAiService.isConfigured()) {
      return undefined;
    }

    const now = Date.now();
    if (now - this.lastRequestTime < this.debounceTime) {
      return undefined;
    }

    if (token.isCancellationRequested) {
      return undefined;
    }

    try {
      const context = this.extractContext(document, position);
      const prompt = this.buildPrompt(context);

      const response = await slashAiService.getCompletion({ prompt });
      const completionText = response.text.trim();

      if (this.isDisposed || token.isCancellationRequested || !completionText) {
        return undefined;
      }

      this.lastRequestTime = now;
      this.statusBarItem.text = 'Code Slash Active';

      const line = document.lineAt(position.line).text;
      const textAfterCursor = line.substring(position.character);
      const filteredCompletion = completionText.split('\n')[0] || completionText;

      if (filteredCompletion.startsWith(textAfterCursor.trim())) {
        return undefined;
      }

      const completion = new vscode.InlineCompletionItem(
        filteredCompletion,
        new vscode.Range(position, position),
        {
          title: '🤖 AI Suggestion',
          command: 'code-slash.acceptInlineCompletion'
        }
      );

      completion.insertText = filteredCompletion;
      completion.range = new vscode.Range(position, position);

      return [completion];
    } catch (error) {
      logger.error('Inline Completion Error:', error as Error);
      return undefined;
    }
  }

  private extractContext(document: vscode.TextDocument, position: vscode.Position): string {
    const startLine = Math.max(0, position.line - 15);
    let context = '';

    for (let i = startLine; i <= position.line; i++) {
      if (i === position.line) {
        const currentLine = document.lineAt(i).text;
        const prefix = currentLine.substring(0, position.character);
        context += prefix;
      } else {
        context += document.lineAt(i).text + '\n';
      }
    }

    return context;
  }

  private buildPrompt(codeContext: string): string {
    return INLINE_COMPLETION_PROMPTS.BUILD_PROMPT(codeContext);
  }

  public async acceptCompletion(position: vscode.Position): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    this.statusBarItem.text = '$(check) Accepted!';

    const timeout = setTimeout(() => {
      this.pendingTimeouts = this.pendingTimeouts.filter(t => t !== timeout);
      if (!this.isDisposed) {
        this.statusBarItem.text = 'Code Slash Active';
      }
    }, 1000);

    this.pendingTimeouts.push(timeout);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.statusBarItem.text = enabled ? 'Code Slash Active' : '$(circle-slash) CUE Disabled';
  }

  public dispose(): void {
    this.isDisposed = true;

    for (const timeout of this.pendingTimeouts) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts = [];

    this.statusBarItem.dispose();
  }
}

export const slashInlineCompletionProvider = new SlashInlineCompletionProvider();
