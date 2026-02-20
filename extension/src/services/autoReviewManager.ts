import * as vscode from 'vscode';
import { ReviewCommand } from '../commands/reviewCommand';
import { Logger } from './logger';

export class AutoReviewManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private logger: Logger;
  private enabled = false;

  constructor(private reviewCommand: ReviewCommand) {
    this.logger = Logger.getInstance();
    this.loadSettings();
    this.registerListeners();
  }

  private loadSettings(): void {
    const config = vscode.workspace.getConfiguration('aiCodeMentor');
    this.enabled = config.get<boolean>('autoReviewOnSave', false);
  }

  private registerListeners(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('aiCodeMentor.autoReviewOnSave')) {
          this.loadSettings();
          this.logger.info(`Auto-review on save: ${this.enabled ? 'enabled' : 'disabled'}`);
        }
      })
    );

    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (this.enabled) {
          this.scheduleReview(document);
        }
      })
    );
  }

  private scheduleReview(document: vscode.TextDocument): void {
    const key = document.uri.toString();
    const existing = this.debounceTimers.get(key);
    
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(key);
      this.logger.info(`Auto-reviewing ${document.fileName} after save...`);
      
      const editor = vscode.window.visibleTextEditors.find(
        (e) => e.document.uri.toString() === key
      );
      
      if (editor) {
        await this.reviewCommand.execute();
      }
    }, 1500);

    this.debounceTimers.set(key, timer);
  }

  toggle(): void {
    this.enabled = !this.enabled;
    const config = vscode.workspace.getConfiguration('aiCodeMentor');
    config.update('autoReviewOnSave', this.enabled, vscode.ConfigurationTarget.Global);
    
    const message = this.enabled
      ? '$(check) Auto-review on save enabled'
      : '$(x) Auto-review on save disabled';
    
    vscode.window.showInformationMessage(message);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.disposables.forEach((d) => d.dispose());
  }
}
