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

      // Obtener respuesta del chat
      let reply = await chat(conversation);

      // Intentar parsear JSON a texto plano
      reply = parseJsonToText(reply);

      conversation.push({ role: 'assistant', content: reply });

      // Enviar texto procesado al frontend
      panel.webview.postMessage({
        command: 'addMessage',
        who: 'assistant',
        text: reply
      });

    } catch (error) {
      vscode.window.showErrorMessage(
        `Error al procesar el mensaje: ${(error as Error).message}`
      );
    }
  }
});

// Función para convertir JSON a texto plano
function parseJsonToText(text: string): string {
  try {
    const obj = JSON.parse(text);
    return formatObject(obj);
  } catch {
    // Si no es JSON válido, devolver tal cual
    return text;
  }
}

// Función recursiva para convertir objetos a texto plano
function formatObject(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
    return `${spaces}${obj}`;
  } else if (Array.isArray(obj)) {
    return obj.map(item => formatObject(item, indent + 1)).join('\n');
  } else if (typeof obj === 'object') {
    return Object.entries(obj)
      .map(([key, value]) => `${spaces}${key}: ${formatObject(value, indent + 1)}`)
      .join('\n');
  }
  return `${spaces}${String(obj)}`;
}
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
  <h3 style="padding:10px;background:#222;margin:0;color:#fff">Chat con AI</h3>
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
        if (message.text) {
          appendMessage(message.who, message.text);
        } else {
          appendMessage(message.who, '[Respuesta vacía]');
        }
      }
    });

    function formatMessage(text) {
      const regex = /\`\`\`([\s\S]*?)\`\`\`/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: 'text', content: text.slice(lastIndex, match.index).trim() });
        }
        parts.push({ type: 'code', content: match[1].trim() });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex).trim() });
      }
      return parts;
    }

    function appendMessage(who, text) {
      const container = document.createElement('div');
      container.className = 'message ' + who;
      const parts = formatMessage(text);
      parts.forEach(part => {
        if (part.type === 'code') {
          const pre = document.createElement('pre');
          pre.textContent = part.content;
          container.appendChild(pre);
        } else if (part.content) {
          const p = document.createElement('div');
          p.textContent = part.content;
          container.appendChild(p);
        }
      });
      messagesDiv.appendChild(container);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  </script>
</body>
</html>`;
}
