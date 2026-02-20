import * as vscode from 'vscode';

import { ReviewDiagnostics } from './diagnostics';
import { ReviewStore } from './reviewStore';

function flattenSymbols(
  symbols: vscode.DocumentSymbol[],
  result: vscode.DocumentSymbol[] = []
): vscode.DocumentSymbol[] {
  for (const symbol of symbols) {
    result.push(symbol);
    if (symbol.children.length > 0) {
      flattenSymbols(symbol.children, result);
    }
  }
  return result;
}

export class AIHoverProvider implements vscode.HoverProvider {
  constructor(
    private diagnostics: ReviewDiagnostics,
    private reviewStore: ReviewStore
  ) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    try {
      const review = this.reviewStore.get(document.uri);
      if (!review || !Array.isArray(review.suggestions)) {
        return undefined;
      }
      // Find suggestion for this line
      const line = position.line + 1;
      const suggestionObj = review.suggestions.find((s) => s.line === line) || review.suggestions[0];
      if (!suggestionObj || typeof suggestionObj.suggestion !== 'string') {
        return undefined;
      }
      const markdown = new vscode.MarkdownString('', true);
      markdown.supportHtml = true;
      markdown.appendMarkdown(`💡 Suggestion: ${suggestionObj.suggestion}`);
      return new vscode.Hover(markdown, new vscode.Range(position, position));
    } catch (error) {
      console.error('Hover provider error:', error);
      return undefined;
    }
  }
}

// The rest of the file (CodeLensProvider, etc.) should be implemented below, ensuring no duplicate or broken logic remains.
