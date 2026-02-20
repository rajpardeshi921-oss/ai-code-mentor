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
    const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
    const security = Array.isArray(parsed.security) ? parsed.security : [];

    const diagnostics: vscode.Diagnostic[] = [];

    // Suggestions
    for (const s of suggestions) {
      const lineIndex = typeof s.line === 'number' ? Math.max(0, s.line - 1) : 0;
      const range = document.lineAt(Math.min(lineIndex, document.lineCount - 1)).range;
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown('$(lightbulb) **Suggestion**\n\n');
      markdown.appendMarkdown(`- ${s.suggestion}`);
      const diagnostic = new vscode.Diagnostic(
        range,
        markdown.value,
        vscode.DiagnosticSeverity.Information
      );
      diagnostic.source = 'AI Code Mentor';
      diagnostic.code = 'suggestion';
      diagnostics.push(diagnostic);
    }

    // Issues
    for (const i of issues) {
      const lineIndex = typeof i.line === 'number' ? Math.max(0, i.line - 1) : 0;
      const range = document.lineAt(Math.min(lineIndex, document.lineCount - 1)).range;
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown('$(warning) **Issue**\n\n');
      markdown.appendMarkdown(`- ${i.issue}`);
      const diagnostic = new vscode.Diagnostic(
        range,
        markdown.value,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'AI Code Mentor';
      diagnostic.code = 'issue';
      diagnostics.push(diagnostic);
    }

    // Security
    for (const sec of security) {
      const lineIndex = typeof sec.line === 'number' ? Math.max(0, sec.line - 1) : 0;
      const range = document.lineAt(Math.min(lineIndex, document.lineCount - 1)).range;
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown('$(shield) **Security**\n\n');
      markdown.appendMarkdown(`- ${sec.security}`);
      const diagnostic = new vscode.Diagnostic(
        range,
        markdown.value,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'AI Code Mentor';
      diagnostic.code = 'security';
      diagnostics.push(diagnostic);
    }

    // Score feedback (shown at top of file)
    if (typeof parsed.score === 'number') {
      const range = document.lineAt(0).range;
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown('$(star) **Score**\n\n');
      markdown.appendMarkdown(`- ${parsed.score}/10`);
      const diagnostic = new vscode.Diagnostic(
        range,
        markdown.value,
        vscode.DiagnosticSeverity.Hint
      );
      diagnostic.source = 'AI Code Mentor';
      diagnostic.code = 'score';
      diagnostics.push(diagnostic);
    }

    return diagnostics;
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
