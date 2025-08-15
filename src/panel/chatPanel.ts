import * as vscode from 'vscode';
import { chat, ChatMessage, setApiKey, hasApiKey } from '../deepseek/client';

export async function openChatPanel(context: vscode.ExtensionContext) {
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

        // Llamada a chat esperando un JSON
        const rawReply = await chat(conversation);

        let parsedReply: any;
        try {
          parsedReply = JSON.parse(rawReply);
        } catch {
          vscode.window.showErrorMessage('Error: la respuesta no es un JSON válido.');
          return;
        }

        conversation.push({ role: 'assistant', content: JSON.stringify(parsedReply, null, 2) });

        // Mandar el JSON parseado al frontend
        panel.webview.postMessage({
          command: 'addMessage',
          who: 'assistant',
          json: parsedReply
        });

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
      font-family: monospace;
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
      background: #1e1e1e;
      color: #dcdcdc;
    }
    .message { margin: 5px 0; white-space: pre-wrap; }
    .user { color: #4fc3f7; }
    .assistant { color: #81c784; }
    #input {
      display: flex;
      padding: 10px;
      background: #252525;
    }
    #input input {
      flex: 1;
      padding: 8px;
      background: #333;
      color: #fff;
      border: none;
      outline: none;
    }
    #input button {
      margin-left: 10px;
      background: #4fc3f7;
      border: none;
      color: #000;
      padding: 8px 12px;
      cursor: pointer;
    }
    pre {
      background-color: #121212;
      color: #dcdcdc;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h3 style="padding:10px;background:#222;margin:0;color:#fff">Chat con AI (JSON)</h3>
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
      if (!text) return;
      appendMessage('user', text);
      appendMessage('assistant', 'Procesando respuesta...');
      vscode.postMessage({ command: 'sendMessage', text });
      input.value = '';
    });

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'addMessage') {
        if (message.json) {
          appendMessage(message.who, JSON.stringify(message.json, null, 2));
        } else {
          appendMessage(message.who, '[Respuesta vacía]');
        }
      }
    });

    function appendMessage(who, text) {
      const div = document.createElement('pre');
      div.className = 'message ' + who;
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  </script>
</body>
</html>`;
}
