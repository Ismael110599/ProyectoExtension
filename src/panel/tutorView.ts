import * as vscode from 'vscode';
import { getLesson } from '../deepseek/client';

export class TutorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ai-mechanic.tutorView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'chooseLevel') {
        const content = await getLesson(message.level);
        webviewView.webview.postMessage({ command: 'showLesson', content });
      }
    });
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 10px; }
    button { margin-right: 8px; }
    #content { white-space: pre-wrap; margin-top: 10px; }
  </style>
</head>
<body>
  <h3>Asistente de Python</h3>
  <div id="level">
    <p>Selecciona tu nivel:</p>
    <button id="beginner">Principiante</button>
    <button id="intermediate">Intermedio</button>
  </div>
  <div id="content"></div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('beginner').addEventListener('click', () => {
      vscode.postMessage({ command: 'chooseLevel', level: 'principiante' });
    });
    document.getElementById('intermediate').addEventListener('click', () => {
      vscode.postMessage({ command: 'chooseLevel', level: 'intermedio' });
    });
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'showLesson') {
        document.getElementById('content').textContent = message.content;
      }
    });
  </script>
</body>
</html>`;
  }
}

