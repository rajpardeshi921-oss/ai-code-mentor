import * as vscode from 'vscode';
import { Logger } from './logger';

export enum StatusBarState {
  Idle = 'idle',
  Scanning = 'scanning',
  Done = 'done'
}

export class StatusBarManager {
  private static instance: StatusBarManager;
  private statusItem: vscode.StatusBarItem;
  private logger: Logger;
  private currentState: StatusBarState = StatusBarState.Idle;

  private constructor() {
    this.statusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.logger = Logger.getInstance();
    this.setState(StatusBarState.Idle);
    this.statusItem.show();
  }

  static getInstance(): StatusBarManager {
    if (!StatusBarManager.instance) {
      StatusBarManager.instance = new StatusBarManager();
    }
    return StatusBarManager.instance;
  }

  setState(state: StatusBarState, extraInfo?: string): void {
    this.currentState = state;

    switch (state) {
      case StatusBarState.Idle:
        this.statusItem.text = '$(robot) AI Mentor Ready';
        this.statusItem.tooltip = 'Click to review current file or workspace';
        this.statusItem.command = 'ai-code-mentor.reviewCode';
        this.statusItem.color = undefined;
        break;

      case StatusBarState.Scanning:
        this.statusItem.text = '$(sync~spin) Reviewing with AI...';
        this.statusItem.tooltip = extraInfo || 'AI is analyzing your code.';
        this.statusItem.command = undefined;
        this.statusItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        break;

      case StatusBarState.Done:
        // If extraInfo is a score, show it
        if (extraInfo && /^\d+(?:\.\d+)?\/?10$/.test(extraInfo)) {
          this.statusItem.text = `$(robot) Code Score: ${extraInfo}`;
          this.statusItem.tooltip = 'Click to view full AI review result.';
        } else {
          this.statusItem.text = '$(star) AI Review Complete';
          this.statusItem.tooltip = extraInfo || 'Review complete. Click to view output.';
        }
        this.statusItem.command = 'ai-code-mentor.showOutput';
        this.statusItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
        setTimeout(() => {
          if (this.currentState === StatusBarState.Done) {
            this.setState(StatusBarState.Idle);
          }
        }, 5000);
        break;
    }
  }

  setIssueCount(count: number): void {
    if (count > 0) {
      this.statusItem.text = `$(warning) ${count} AI Issues`;
      this.statusItem.tooltip = `${count} issue${count > 1 ? 's' : ''} found. Click to review.`;
      this.statusItem.command = 'workbench.actions.view.problems';
    }
  }

  setReviewScore(score: number | null): void {
    if (score !== null) {
      this.statusItem.text = `$(star-full) AI Score: ${score}/10`;
      this.statusItem.tooltip = `Code quality score: ${score}/10`;
      this.statusItem.command = 'ai-code-mentor.showOutput';
      this.statusItem.color = undefined;
      setTimeout(() => {
        if (this.currentState !== StatusBarState.Scanning) {
          this.setState(StatusBarState.Idle);
        }
      }, 10000);
    }
  }

  showOutput(): void {
    this.logger.show();
  }

  dispose(): void {
    this.statusItem.dispose();
  }
}
