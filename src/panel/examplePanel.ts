import * as vscode from 'vscode';
import { getSuggestions } from '../deepseek/client';

export function openExamplePanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'exampleValidator',
    'Validador de Ejemplos',
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  );

  panel.webview.html = getWebviewContent();

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === 'validate') {
      const suggestions = await getSuggestions(message.code);
      panel.webview.postMessage({ command: 'result', suggestions });
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
    body { font-family: sans-serif; margin: 0 20px; }
    textarea { width: 100%; height: 200px; }
    button { margin-top: 10px; }
    pre { background: #f3f3f3; padding: 10px; }
  </style>
</head>
<body>
  <h2>Escribe tu ejemplo de código</h2>
  <textarea id="code"></textarea>
  <br/>
  <button id="validate">Validar</button>
  <pre id="result"></pre>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('validate').addEventListener('click', () => {
      const code = (document.getElementById('code')).value;
      vscode.postMessage({ command: 'validate', code });
    });
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'result') {
        document.getElementById('result').textContent = message.suggestions.join('\n');
      }
    });
  </script>
</body>
</html>`;
}
