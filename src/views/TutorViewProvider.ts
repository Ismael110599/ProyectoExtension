import * as vscode from 'vscode';
import { getLesson, chat, ChatMessage } from '../deepseek/client';

export class TutorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ai-mechanic.tutorView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml(webviewView.webview);


    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'chooseLevel') {
        conversation.length = 0;
        const content = await getLesson(message.level);
        conversation.push({ role: 'assistant', content });
        webviewView.webview.postMessage({
          command: 'addMessage',
          who: 'assistant',
          text: content,
        });
      } else if (message.command === 'sendMessage') {
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
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'tutor.css')
    );
    const appUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'app.js')
    );
    const formatUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'format.js')
    );

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
</head>
<body>
  <div class="header">
    <h1>
      <span class="python-icon"></span>
      Asistente de Python
    </h1>
    <div class="subtitle">Tu compañero de aprendizaje inteligente</div>
  </div>

  <div class="level-selection" id="levelSelection">
    <h3>🎯 Selecciona tu nivel de experiencia:</h3>
    <div class="level-buttons">
      <button class="level-btn" id="beginner">
        <span class="level-icon">🌱</span>
        Principiante
      </button>
      <button class="level-btn" id="intermediate">
        <span class="level-icon">⚡</span>
        Intermedio
      </button>
    </div>
  </div>

  <div class="chat-container" id="chatContainer" style="display: none;">
    <div class="messages" id="messages">
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <h3>¡Comencemos a aprender Python!</h3>
        <p>Escribe tu pregunta o duda y te ayudaré paso a paso</p>
      </div>
    </div>

    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          id="messageInput"
          class="input-field"
          placeholder="Escribe tu pregunta sobre Python..."
          rows="1"
        ></textarea>
        <button class="send-btn" id="sendBtn">
          <span>📤</span>
          Enviar
        </button>
      </div>
    </div>
  </div>

  <script src="${formatUri}"></script>
  <script src="${appUri}"></script>
</body>
</html>`;
  }
}
