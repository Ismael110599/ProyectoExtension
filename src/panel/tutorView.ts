import * as vscode from 'vscode';
import { getLesson, chat, ChatMessage } from '../deepseek/client';

export class TutorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ai-mechanic.tutorView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    const conversation: ChatMessage[] = [];

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

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 10px; display: flex; flex-direction: column; height: 100%; }
    button { margin-right: 8px; }
    #messages { flex: 1; border: 1px solid #ccc; overflow-y: auto; padding: 5px; }
    .message { margin: 5px 0; }
    .user { text-align: right; color: blue; }
    .assistant { text-align: left; color: green; }
    #input { display: flex; margin-top: 10px; }
    #input input { flex: 1; }
  </style>
</head>
<body>
  <h3>Asistente de Python</h3>
  <div id="level">
    <p>Selecciona tu nivel:</p>
    <button id="beginner">Principiante</button>
    <button id="intermediate">Intermedio</button>
  </div>
  <div id="messages"></div>
  <div id="input">
    <input id="text" type="text" placeholder="Escribe un mensaje" />
    <button id="send">Enviar</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('beginner').addEventListener('click', () => {
      vscode.postMessage({ command: 'chooseLevel', level: 'principiante' });
    });
    document.getElementById('intermediate').addEventListener('click', () => {
      vscode.postMessage({ command: 'chooseLevel', level: 'intermedio' });
    });
    document.getElementById('send').addEventListener('click', sendMessage);
    document.getElementById('text').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { sendMessage(); }
    });
    const messagesDiv = document.getElementById('messages');
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'addMessage') {
        appendMessage(message.who, message.text);
      }
    });
    function sendMessage() {
      const input = document.getElementById('text');
      const text = input.value;
      if (!text) { return; }
      appendMessage('user', text);
      vscode.postMessage({ command: 'sendMessage', text });
      input.value = '';
    }
    function appendMessage(who, text) {
      const div = document.createElement('div');
      div.className = 'message ' + who;
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  </script>
</body>
</html>`;
  }
}

