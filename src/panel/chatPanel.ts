import * as vscode from 'vscode';
import { chat, ChatMessage, setApiKey, hasApiKey } from '../deepseek/client';

export async function openChatPanel(context: vscode.ExtensionContext) {
  if (!hasApiKey()) {
    const key = await vscode.window.showInputBox({
      prompt: 'Ingresa tu Kimi API Key',
      ignoreFocusOut: true,
    });
    if (!key) {
      vscode.window.showErrorMessage('Se requiere una API key de Kimi.');
      return;
    }
    setApiKey(key);
  }
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
      try {
        conversation.push({ role: 'user', content: message.text });
        const reply = await chat(conversation);
        conversation.push({ role: 'assistant', content: reply });
        panel.webview.postMessage({ command: 'addMessage', who: 'assistant', text: reply });
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error al procesar el mensaje: ${(error as Error).message}`
        );
      }
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
    * { box-sizing: border-box; }
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    #messages {
      flex: 1;
      border: 1px solid #ccc;
      overflow-y: auto;
      padding: 10px;
    }
    .message { margin: 5px 0; }
    .user { text-align: right; color: blue; }
    .assistant { text-align: left; color: green; }
    #input {
      display: flex;
      padding: 10px;
    }
    #input input {
      flex: 1;
      padding: 8px;
    }
    #input button {
      margin-left: 10px;
    }
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
    let pendingDiv = null;

    document.getElementById('send').addEventListener('click', () => {
      const input = document.getElementById('text');
      const text = input.value;
      if (!text) { return; }
      appendMessage('user', text);
      pendingDiv = appendMessage('assistant', 'Procesando respuesta...');
      vscode.postMessage({ command: 'sendMessage', text });
      input.value = '';
    });

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'addMessage') {
        const clean = markdownToText(message.text);
        if (pendingDiv) {
          pendingDiv.textContent = clean;
          pendingDiv = null;
        } else {
          appendMessage(message.who, clean);
        }
      }
    });

    function appendMessage(who, text) {
      const div = document.createElement('div');
      div.className = 'message ' + who;
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      return div;
    }

    function markdownToText(md) {
      return md
        .replace(/\x60{3}[\s\S]*?\x60{3}/g, (m) => m.replace(/\x60{3}/g, ''))
        .replace(/\x60([^\x60]+)\x60/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^>\s?/gm, '')
        .replace(/^[*-]\s+/gm, '')
        .trim();
    }
  </script>
</body>
</html>`;
}
