import * as vscode from 'vscode';
import { aiService } from '@/services/slash-ai-service';
import { logger } from '@/base/logging';

interface ImportCandidate {
  symbol: string;
  suggestedImport: string;
  confidence: number;
}

export class SmartImportFeature {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private statusBarItem: vscode.StatusBarItem;
  private currentDocument: vscode.TextDocument | null = null;
  private isDisposed: boolean = false;
  private pendingTimeouts: NodeJS.Timeout[] = [];

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('code-slash-smart-import');
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.text = '$(lightbulb) Smart Import';
    this.statusBarItem.tooltip = 'Click to scan for missing imports';
    this.statusBarItem.command = 'code-slash.scanImports';
    this.statusBarItem.show();
  }

  public async scanDocument(document: vscode.TextDocument): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    this.currentDocument = document;

    const candidates = await this.detectMissingImports(document);

    if (this.isDisposed) {
      return;
    }

    if (candidates.length > 0) {
      this.showImportSuggestions(candidates, document);
      this.statusBarItem.text = `$(warning) ${candidates.length} Missing Import(s)`;
      this.statusBarItem.show();
    } else {
      this.statusBarItem.text = '$(check) All Imports Complete';
      this.diagnosticCollection.clear();
    }
  }

  private async detectMissingImports(document: vscode.TextDocument): Promise<ImportCandidate[]> {
    const symbols = this.extractUndefinedSymbols(document);

    if (symbols.length === 0) {
      return [];
    }

    const prompt = this.buildImportDetectionPrompt(document, symbols);

    try {
      const response = await aiService.getCompletion({ prompt });
      return this.parseImportSuggestions(response.text, symbols);
    } catch (error) {
      logger.error('Smart Import Error:', error as Error);
      return [];
    }
  }

  private extractUndefinedSymbols(document: vscode.TextDocument): string[] {
    const undefinedSymbols: Set<string> = new Set();
    const text = document.getText();
    const lines = text.split('\n');
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const existingImports: Set<string> = new Set();

    let match;
    while ((match = importRegex.exec(text)) !== null) {
      existingImports.add(match[1]);
    }

    const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    const definedSymbols: Set<string> = new Set([
      'console',
      'window',
      'document',
      'module',
      'exports',
      'require',
      'process',
      'Buffer',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'Promise',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Object',
      'Array',
      'String',
      'Number',
      'Boolean',
      'Function',
      'Symbol',
      'Error',
      'TypeError',
      'SyntaxError',
      'ReferenceError',
      'JSON',
      'Math',
      'Date',
      'RegExp',
      'Proxy',
      'Reflect'
    ]);

    for (const line of lines) {
      const definitionPatterns = [
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
        /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
        /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
        /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
        /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
        /export\s+(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/
      ];

      for (const pattern of definitionPatterns) {
        const defMatch = line.match(pattern);
        if (defMatch) {
          definedSymbols.add(defMatch[1]);
        }
      }
    }

    while ((match = identifierPattern.exec(text)) !== null) {
      const symbol = match[1];
      if (
        !definedSymbols.has(symbol) &&
        !existingImports.has(symbol) &&
        !symbol.match(/^\d/) &&
        !['true', 'false', 'null', 'undefined'].includes(symbol)
      ) {
        undefinedSymbols.add(symbol);
      }
    }

    return Array.from(undefinedSymbols).slice(0, 10);
  }

  private buildImportDetectionPrompt(document: vscode.TextDocument, symbols: string[]): string {
    const language = this.getLanguageId(document);
    const code = document.getText().substring(0, 3000);

    return `Analyze the following ${language} code and identify which symbols from the list "${symbols.join(', ')}" are likely imported from external modules or packages.

Current file type: ${language}
Code snippet:
${code}

For each symbol that appears to be from an external source, provide the import statement in the format:
SYMBOL:import statement

For example:
React:import React from 'react'
useState:import { useState } from 'react'
lodash:import _ from 'lodash'

Only respond with symbols that have high confidence of being external imports. If unsure, don't include the symbol.`;
  }

  private parseImportSuggestions(response: string, symbols: string[]): ImportCandidate[] {
    const candidates: ImportCandidate[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const symbol = line.substring(0, colonIndex).trim();
        const importStmt = line.substring(colonIndex + 1).trim();

        if (symbols.includes(symbol) && importStmt.startsWith('import')) {
          candidates.push({
            symbol,
            suggestedImport: importStmt,
            confidence: 0.8
          });
        }
      }
    }

    return candidates;
  }

  private showImportSuggestions(
    candidates: ImportCandidate[],
    document: vscode.TextDocument
  ): void {
    const diagnostics: vscode.Diagnostic[] = [];

    for (const candidate of candidates) {
      const undefinedSymbols = this.extractUndefinedSymbols(document);
      if (undefinedSymbols.includes(candidate.symbol)) {
        const range = this.findSymbolRange(document, candidate.symbol);

        if (range) {
          const diagnostic = new vscode.Diagnostic(
            range,
            `Missing import: ${candidate.suggestedImport}`,
            vscode.DiagnosticSeverity.Information
          );
          diagnostic.code = {
            value: 'smart-import',
            target: vscode.Uri.parse('command:code-slash.addImport')
          };
          diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];

          diagnostics.push(diagnostic);
        }
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private findSymbolRange(document: vscode.TextDocument, symbol: string): vscode.Range | null {
    const text = document.getText();
    const pattern = new RegExp(`\\b${symbol}\\b`, 'g');
    const match = pattern.exec(text);

    if (match) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      return new vscode.Range(startPos, endPos);
    }

    return null;
  }

  public async addImport(importStatement: string, document: vscode.TextDocument): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document) {
      return;
    }

    const firstLine = document.lineAt(0);
    const edit = new vscode.WorkspaceEdit();

    const insertPosition = new vscode.Position(0, 0);
    const importWithNewline = importStatement + '\n';

    edit.insert(document.uri, insertPosition, importWithNewline);

    await vscode.workspace.applyEdit(edit);

    this.statusBarItem.text = '$(check) Import Added';

    const timeout = setTimeout(async () => {
      this.pendingTimeouts = this.pendingTimeouts.filter(t => t !== timeout);
      if (!this.isDisposed && vscode.window.activeTextEditor?.document === document) {
        await this.scanDocument(document);
      }
    }, 1000);

    this.pendingTimeouts.push(timeout);
  }

  public async addAllImports(
    candidates: ImportCandidate[],
    document: vscode.TextDocument
  ): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const imports = candidates.map(c => c.suggestedImport).join('\n') + '\n';

    edit.insert(document.uri, new vscode.Position(0, 0), imports);
    await vscode.workspace.applyEdit(edit);

    await this.scanDocument(document);
  }

  private getLanguageId(document: vscode.TextDocument): string {
    const languageMap: Record<string, string> = {
      typescript: 'TypeScript',
      typescriptreact: 'TypeScript',
      javascript: 'JavaScript',
      javascriptreact: 'JavaScript',
      python: 'Python',
      go: 'Go'
    };

    return languageMap[document.languageId] || document.languageId;
  }

  public dispose(): void {
    this.isDisposed = true;

    for (const timeout of this.pendingTimeouts) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts = [];

    this.diagnosticCollection.dispose();
    this.statusBarItem.dispose();
  }
}

export const smartImport = new SmartImportFeature();
