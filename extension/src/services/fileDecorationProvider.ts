import * as vscode from 'vscode';
import { ReviewStore } from '../review/reviewStore';

export class FileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor(private reviewStore: ReviewStore) {}

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    const review = this.reviewStore.get(uri);
    if (!review) {
      return undefined;
    }

    const suggestionCount = Array.isArray(review.suggestions) ? review.suggestions.length : 0;

    if (suggestionCount > 0) {
      return {
        badge: '💡',
        color: new vscode.ThemeColor('list.warningForeground'),
        tooltip: `${suggestionCount} suggestion${suggestionCount > 1 ? 's' : ''} found by AI`
      };
    }

    return {
      badge: '✓',
      color: new vscode.ThemeColor('testing.iconPassed'),
      tooltip: 'AI review passed'
    };
  }

  refresh(uri?: vscode.Uri): void {
    if (uri) {
      this._onDidChangeFileDecorations.fire(uri);
    } else {
      this._onDidChangeFileDecorations.fire([]);
    }
  }

  dispose(): void {
    this._onDidChangeFileDecorations.dispose();
  }
}
