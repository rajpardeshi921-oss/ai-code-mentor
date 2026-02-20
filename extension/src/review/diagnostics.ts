import * as vscode from 'vscode';
import { ParsedReview, ReviewIssue } from '../types';

function mapSeverity(severity: ReviewIssue['severity']): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warning':
      return vscode.DiagnosticSeverity.Warning;
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}

function resolveLineIndex(document: vscode.TextDocument, line?: number): number | null {
  if (!document || document.lineCount === 0) {
    return null;
  }

  const target = typeof line === 'number' ? line - 1 : 0;
  const safeLine = Math.max(0, Math.min(target, document.lineCount - 1));
  return safeLine;
}

function buildDiagnostics(
  document: vscode.TextDocument,
  parsed: ParsedReview
): vscode.Diagnostic[] {
  try {
    if (!document || !parsed) {
      return [];
    }

    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    const suggestionDiagnostics = suggestions.map((s: any) => {
      const lineIndex = typeof s.line === 'number' ? Math.max(0, s.line - 1) : 0;
      const range = document.lineAt(Math.min(lineIndex, document.lineCount - 1)).range;
      const diagnostic = new vscode.Diagnostic(
        range,
        s.suggestion,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'AI Code Mentor';
      return diagnostic;
    });

    return suggestionDiagnostics;
  } catch (error) {
    console.error('buildDiagnostics error:', error);
    return [];
  }
}

export class ReviewDiagnostics implements vscode.Disposable {
  private collection = vscode.languages.createDiagnosticCollection('ai-code-mentor');

  update(document: vscode.TextDocument, parsed: ParsedReview): void {
    try {
      if (!document || !parsed) {
        return;
      }
      const diagnostics = buildDiagnostics(document, parsed);
      this.collection.set(document.uri, diagnostics);
    } catch (error) {
      console.error('update diagnostics error:', error);
    }
  }

  get(uri: vscode.Uri): readonly vscode.Diagnostic[] {
    return this.collection.get(uri) || [];
  }

  clear(uri: vscode.Uri): void {
    this.collection.delete(uri);
  }

  dispose(): void {
    this.collection.dispose();
  }
}
