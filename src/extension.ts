import * as vscode from 'vscode';
import { startLiveListener, registerCompletionProvider } from './listener/liveEditorListener';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Helper activado');

  startLiveListener(context);
  registerCompletionProvider(context);

  vscode.window.showInformationMessage('AI Helper listo con DeepSeek!');
}

export function deactivate() {}
