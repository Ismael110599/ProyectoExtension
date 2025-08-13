import * as vscode from 'vscode';
import { getLesson } from '../deepseek/client';
import { localLessons } from '../data/lessons';

export class TutorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ai-mechanic.tutorView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();
    const lessonIndex: Record<'principiante' | 'intermedio', number> = {
      principiante: 0,
      intermedio: 0
    };

    const sendLesson = async (level: 'principiante' | 'intermedio') => {
      const idx = lessonIndex[level] ?? 0;
      const preset = localLessons[level][idx];
      if (preset) {
        webviewView.webview.postMessage({ command: 'showLesson', content: preset });
        lessonIndex[level] = idx + 1;
      } else {
        const content = await getLesson(level);
        webviewView.webview.postMessage({ command: 'showLesson', content });
      }
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'chooseLevel') {
        const lvl = message.level as 'principiante' | 'intermedio';
        lessonIndex[lvl] = 0;
        await sendLesson(lvl);
      } else if (message.command === 'nextLesson') {
        const lvl = message.level as 'principiante' | 'intermedio';
        await sendLesson(lvl);
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
  <button id="next" style="display:none;">Siguiente</button>
  <script>
    const vscode = acquireVsCodeApi();
    let currentLevel = null;
    document.getElementById('beginner').addEventListener('click', () => {
      currentLevel = 'principiante';
      vscode.postMessage({ command: 'chooseLevel', level: currentLevel });
    });
    document.getElementById('intermediate').addEventListener('click', () => {
      currentLevel = 'intermedio';
      vscode.postMessage({ command: 'chooseLevel', level: currentLevel });
    });
    document.getElementById('next').addEventListener('click', () => {
      vscode.postMessage({ command: 'nextLesson', level: currentLevel });
    });
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'showLesson') {
        document.getElementById('content').textContent = message.content;
        document.getElementById('next').style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
  }
}

