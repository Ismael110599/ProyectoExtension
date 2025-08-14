import * as vscode from 'vscode';
import { chat, ChatMessage } from '../deepseek/client';

export function openChatPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'aiChat',
    'Chat AI',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = getWebviewContent();

  const conversation: ChatMessage[] = [];

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === 'sendMessage') {
      conversation.push({ role: 'user', content: message.text });
      const reply = await chat(conversation);
      conversation.push({ role: 'assistant', content: reply });
      panel.webview.postMessage({ command: 'addMessage', who: 'assistant', text: reply });
    }
  });

  context.subscriptions.push(panel);
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; margin: 0; padding: 10px; }
    #messages { border: 1px solid #ccc; height: 300px; overflow-y: auto; padding: 5px; }
    .message { margin: 5px 0; }
    .user { text-align: right; color: blue; }
    .assistant { text-align: left; color: green; }
    #input { display: flex; margin-top: 10px; }
    #input input { flex: 1; }
  </style>
</head>
<body>
  <h3>Chat con AI</h3>
  <div id="messages"></div>
  <div id="input">
    <input id="text" type="text" placeholder="Escribe un mensaje" />
    <button id="send">Enviar</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const messagesDiv = document.getElementById('messages');

    document.getElementById('send').addEventListener('click', () => {
      const input = document.getElementById('text');
      const text = input.value;
      if (!text) { return; }
      appendMessage('user', text);
      vscode.postMessage({ command: 'sendMessage', text });
      input.value = '';
    });

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'addMessage') {
        appendMessage(message.who, message.text);
      }
    });

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
