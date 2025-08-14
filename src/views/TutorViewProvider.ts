import * as vscode from 'vscode';
import { chat, ChatMessage, hasApiKey, setApiKey } from '../deepseek/client';

export class TutorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ai-mechanic.tutorView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    webviewView.webview.options = { enableScripts: true };

    if (!hasApiKey()) {
      const key = await vscode.window.showInputBox({
        prompt: 'Ingresa tu DeepSeek API Key',
        ignoreFocusOut: true,
      });
      if (!key) {
        vscode.window.showErrorMessage('Se requiere una API key de DeepSeek.');
        return;
      }
      setApiKey(key);
    }

    webviewView.webview.html = this.getHtml(webviewView.webview);

    const conversation: ChatMessage[] = [];

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'sendMessage') {
        conversation.push({ role: 'user', content: message.text });
        const reply = await chat(conversation);
        conversation.push({ role: 'assistant', content: reply });
        webviewView.webview.postMessage({
          command: 'addMessage',
          who: 'assistant',
          text: reply,
        });
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'app.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'tutor.css')
    );
    const formatUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'format.js')
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${styleUri}">
</head>
<body>
<div id="messages"></div>
<div class="input"><input id="text" type="text" placeholder="Escribe un mensaje" /><button id="send">Enviar</button></div>
<script nonce="${nonce}" src="${formatUri}"></script>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
