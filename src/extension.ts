import * as vscode from 'vscode';
import { startLiveListener, registerCompletionProvider } from './listener/liveEditorListener';
import { openExamplePanel } from './panel/examplePanel';
import { openChatPanel } from './panel/chatPanel';
import { TutorViewProvider } from './panel/tutorView';


export function activate(context: vscode.ExtensionContext) {
  console.log('AI Helper activado');

  startLiveListener(context);
  registerCompletionProvider(context);

  const tutorProvider = new TutorViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(TutorViewProvider.viewType, tutorProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ai-mechanic.openExampleValidator', () =>
      openExamplePanel(context)
    )
  );
  vscode.window.showInformationMessage('AI Helper listo con DeepSeek!');
}

export function deactivate() {}
