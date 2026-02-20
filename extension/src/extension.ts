import * as vscode from 'vscode';
import { ReviewCommand, getReviewTarget } from './commands/reviewCommand';
import {
  AIHoverProvider,
  ReviewDiagnostics,
  ReviewStore
} from './review';
import { Logger } from './services/logger';
import { FileCache } from './services/fileCache';
import { FileDecorationProvider } from './services/fileDecorationProvider';
import { StatusBarManager, StatusBarState } from './services/statusBarManager';
import { AutoReviewManager } from './services/autoReviewManager';

/**
 * Represents the extension context for AI Code Mentor
 */
let extension: AICodeMentorExtension | undefined;

/**
 * Main extension class that manages activation and deactivation
 */
class AICodeMentorExtension {
  private reviewCommand: ReviewCommand;
  private reviewStore: ReviewStore;
  private diagnostics: ReviewDiagnostics;
  private decorationProvider: FileDecorationProvider;
  private statusBar: StatusBarManager;
  private autoReviewManager: AutoReviewManager;
  private logger: Logger;

  constructor(context: vscode.ExtensionContext) {
    this.logger = Logger.getInstance();
    this.reviewStore = new ReviewStore();
    this.diagnostics = new ReviewDiagnostics();
    this.decorationProvider = new FileDecorationProvider(this.reviewStore);
    this.statusBar = StatusBarManager.getInstance();

    // Initialize the review command handler
    this.reviewCommand = new ReviewCommand(
      this.reviewStore,
      this.diagnostics,
      this.decorationProvider,
      this.statusBar
    );

    this.autoReviewManager = new AutoReviewManager(this.reviewCommand);
    
    // Register all commands
    this.registerCommands(context);
    this.registerProviders(context);
    this.registerCleanup(context);

    this.logger.info('AI Code Mentor extension activated');
  }

  /**
   * Register all extension commands
   */
  private registerCommands(context: vscode.ExtensionContext): void {
    const reviewDisposable = vscode.commands.registerCommand(
      'ai-code-mentor.reviewCode',
      () => this.smartReview()
    );

    const reviewWorkspaceDisposable = vscode.commands.registerCommand(
      'ai-code-mentor.reviewWorkspace',
      () => this.reviewCommand.executeWorkspaceReview()
    );

    const menuDisposable = vscode.commands.registerCommand(
      'ai-code-mentor.showReviewMenu',
      (uri?: vscode.Uri) => this.showReviewMenu(uri)
    );

    const clearDisposable = vscode.commands.registerCommand(
      'ai-code-mentor.clearDiagnostics',
      () => this.clearDiagnostics()
    );

    const toggleAutoReviewDisposable = vscode.commands.registerCommand(
      'ai-code-mentor.toggleAutoReview',
      () => this.autoReviewManager.toggle()
    );

    const showOutputDisposable = vscode.commands.registerCommand(
      'ai-code-mentor.showOutput',
      () => this.logger.show()
    );

    context.subscriptions.push(
      reviewDisposable,
      reviewWorkspaceDisposable,
      menuDisposable,
      clearDisposable,
      toggleAutoReviewDisposable,
      showOutputDisposable,
      this.autoReviewManager
    );
  }

  private registerProviders(context: vscode.ExtensionContext): void {
    const selector: vscode.DocumentSelector = { scheme: 'file' };

    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        selector,
        new AIHoverProvider(this.diagnostics, this.reviewStore)
      ),
      vscode.window.registerFileDecorationProvider(this.decorationProvider),
      this.diagnostics,
      this.decorationProvider
    );
  }

  private registerCleanup(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.reviewStore.delete(document.uri);
        this.diagnostics.clear(document.uri);
        this.decorationProvider.refresh(document.uri);
      })
    );
  }

  private clearDiagnostics(): void {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.setStatusBarMessage('$(info) No active file to clear diagnostics from', 3000);
        return;
      }
      
      this.diagnostics.clear(editor.document.uri);
      this.reviewStore.delete(editor.document.uri);
      this.decorationProvider.refresh(editor.document.uri);
      FileCache.getInstance().delete(editor.document.uri);
      vscode.window.setStatusBarMessage('$(check) AI diagnostics cleared', 3000);
      this.logger.info(`Cleared diagnostics for ${editor.document.fileName}`);
    } catch (error) {
      console.error('Clear diagnostics failed:', error);
      this.logger.error('Failed to clear diagnostics', error as Error);
    }
  }

  /**
   * Smart review that automatically chooses between file and workspace review
   */
  private async smartReview(): Promise<void> {
    try {
      const target = getReviewTarget();

      switch (target) {
        case 'file':
          await this.reviewCommand.execute();
          break;
        
        case 'workspace':
          await this.reviewCommand.executeWorkspaceReview();
          break;
        
        case 'none':
          vscode.window.setStatusBarMessage(
            '$(info) Open a file or folder to start AI review',
            3000
          );
          this.logger.info('No review target available');
          break;
      }
    } catch (error) {
      console.error('Smart review crashed:', error);
      this.logger.error('Review command failed', error as Error);
      vscode.window.showErrorMessage('AI Reviewer crashed. See Output logs.');
    }
  }

  private getReviewForUri(uri?: vscode.Uri) {
    const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
    if (!targetUri) {
      return undefined;
    }

    return this.reviewStore.get(targetUri);
  }

  private async showReviewMenu(uri?: vscode.Uri): Promise<void> {
    const review = this.getReviewForUri(uri);
    if (!review) {
      vscode.window.showInformationMessage('No AI review available for this file yet.');
      return;
    }

    const selection = await vscode.window.showQuickPick(
      [
        'Show full summary',
        'Apply fixes (future)',
        'Re-run review'
      ],
      { placeHolder: 'AI Review actions' }
    );

    if (!selection) {
      return;
    }

    if (selection === 'Show full summary') {
      const scoreText = review.score !== null ? `${review.score}/10` : 'N/A';
      vscode.window.showInformationMessage(`Summary (${scoreText}): ${review.summary}`);
      return;
    }

    if (selection === 'Apply fixes (future)') {
      vscode.window.showInformationMessage('Fix application is coming soon.');
      return;
    }

    await this.reviewCommand.execute();
  }
}

/**
 * Extension activation function - called when the extension is activated
 * Activation happens when:
 * 1. The command "ai-code-mentor.reviewCode" is invoked
 * 2. VS Code loads the extension based on activationEvents in package.json
 */
export function activate(context: vscode.ExtensionContext): void {
  try {
    // Create and initialize the extension
    extension = new AICodeMentorExtension(context);

    // Log activation message
    console.log('AI Code Mentor extension is now active');
  } catch (error) {
    console.error('Activation failed:', error);
    vscode.window.showErrorMessage('AI Code Reviewer failed to activate. Check console for details.');
  }
}

/**
 * Extension deactivation function - called when the extension is deactivated
 * Cleanup happens automatically through disposables in subscriptions
 */
export function deactivate(): void {
  extension = undefined;
  console.log('AI Code Mentor extension has been deactivated');
}
