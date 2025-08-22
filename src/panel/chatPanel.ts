import * as vscode from 'vscode';
import { chat, ChatMessage, setApiKey, hasApiKey } from '../deepseek/client';

// Tipos y funciones auxiliares para análisis académico (stub temporal)
type AcademicReport = any;

async function analyzeAcademicPerformance(nombre_carrera: string, datos_notas: any): Promise<AcademicReport | { error: string }> {
  return { error: 'Funcionalidad no disponible' };
}

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

        // Intentar interpretar el mensaje como datos académicos en JSON
        let data: any = null;
        try {
          data = JSON.parse(message.text);
        } catch {
          data = null;
        }

        if (data && data.nombre_carrera && data.datos_notas) {
          const report = await analyzeAcademicPerformance(data.nombre_carrera, data.datos_notas);
          const reply = formatAcademicReport(report);
          conversation.push({ role: 'assistant', content: reply });
          panel.webview.postMessage({
            command: 'replaceLastMessage',
            who: 'assistant',
            text: reply
          });
          return;
        }

        // Obtener respuesta de chat normal
        const reply = await chat(conversation);
        conversation.push({ role: 'assistant', content: reply });
        panel.webview.postMessage({
          command: 'replaceLastMessage',
          who: 'assistant',
          text: reply
        });

      } catch (error) {
        panel.webview.postMessage({
          command: 'replaceLastMessage',
          who: 'assistant',
          text: `Error: ${(error as Error).message}`
        });
        vscode.window.showErrorMessage(
          `Error al procesar el mensaje: ${(error as Error).message}`
        );
      }
    }
  });

  context.subscriptions.push(panel);
}

// ============================================
// Formatear reportes académicos para mostrar
// ============================================

function formatAcademicReport(report: AcademicReport | { error: string }): string {
  if ((report as any).error) {
    return `Error: ${(report as any).error}`;
  }

  let result = 'Resumen general:\n';
  const resumen = (report as AcademicReport).resumen_general;
  if (resumen) {
    result += `Promedio del grupo: ${resumen.promedio_grupo}\n`;
    result += `Total de estudiantes: ${resumen.total_estudiantes}\n`;
    result += `Nivel de riesgo del grupo: ${resumen.nivel_riesgo_grupo}\n`;
    result += `Estado general del grupo: ${resumen.estado_general_grupo}\n`;
  }

  if ((report as AcademicReport).estudiantes && (report as AcademicReport).estudiantes.length > 0) {
    result += '\nEstudiantes:\n';
    (report as AcademicReport).estudiantes.forEach((est: any, index: number) => {
      result += `\n${index + 1}. ${est.nombre} - ${est.curso}\n`;
      result += `Promedio: ${est.promedio}\n`;
      result += `Nivel de riesgo: ${est.nivel_riesgo}\n`;
      result += `Estado general: ${est.estado_general}\n`;
      if (est.analisis_especifico) {
        if (est.analisis_especifico.fortalezas?.length) {
          result += `Fortalezas: ${est.analisis_especifico.fortalezas.join(', ')}\n`;
        }
        if (est.analisis_especifico.debilidades?.length) {
          result += `Debilidades: ${est.analisis_especifico.debilidades.join(', ')}\n`;
        }
        if (est.analisis_especifico.oportunidades?.length) {
          result += `Oportunidades: ${est.analisis_especifico.oportunidades.join(', ')}\n`;
        }
        if (est.analisis_especifico.amenazas?.length) {
          result += `Amenazas: ${est.analisis_especifico.amenazas.join(', ')}\n`;
        }
      }
      if (est.recomendaciones) {
        if (est.recomendaciones.inmediatas?.length) {
          result += `Recomendaciones inmediatas: ${est.recomendaciones.inmediatas.join(', ')}\n`;
        }
        if (est.recomendaciones.corto_plazo?.length) {
          result += `Recomendaciones a corto plazo: ${est.recomendaciones.corto_plazo.join(', ')}\n`;
        }
        if (est.recomendaciones.largo_plazo?.length) {
          result += `Recomendaciones a largo plazo: ${est.recomendaciones.largo_plazo.join(', ')}\n`;
        }
      }
    });
  }

  const grupales = (report as AcademicReport).recomendaciones_grupales;
  if (grupales) {
    result += '\nRecomendaciones grupales:\n';
    if (grupales.mejoras_metodologicas?.length) {
      result += `Mejoras metodológicas: ${grupales.mejoras_metodologicas.join(', ')}\n`;
    }
    if (grupales.recursos_sugeridos?.length) {
      result += `Recursos sugeridos: ${grupales.recursos_sugeridos.join(', ')}\n`;
    }
    if (grupales.actividades_complementarias?.length) {
      result += `Actividades complementarias: ${grupales.actividades_complementarias.join(', ')}\n`;
    }
  }

  return result.trim();
}

// ============================================
// HTML del Webview
// ============================================
function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    #messages {
      flex: 1;
      border: 1px solid var(--vscode-editorWidget-border);
      overflow-y: auto;
      padding: 10px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    .message { 
      margin: 10px 0; 
      white-space: pre-wrap; 
      line-height: 1.5;
    }
    .user {
      color: var(--vscode-textLink-foreground);
      font-weight: bold;
    }
    .assistant {
      color: var(--vscode-charts-green);
    }
    .processing {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }
    #input {
      display: flex;
      padding: 10px;
      background: var(--vscode-editor-background);
    }
    #input input {
      flex: 1;
      padding: 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      outline: none;
      border-radius: 4px;
    }
    #input button {
      margin-left: 10px;
      background: var(--vscode-button-background);
      border: none;
      color: var(--vscode-button-foreground);
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
    }
    #input button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <h3 style="padding:10px;margin:0;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground)">💬 Chat con AI</h3>
  <div id="messages"></div>
  <div id="input">
    <input id="text" type="text" placeholder="Escribe un mensaje..." />
    <button id="send">Enviar</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesDiv = document.getElementById('messages');

    document.getElementById('send').addEventListener('click', sendMessage);
    
    document.getElementById('text').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    function sendMessage() {
      const input = document.getElementById('text');
      const text = input.value.trim();
      if (!text) return;
      
      appendMessage('user', text);
      appendMessage('assistant', 'Procesando respuesta...', true);
      vscode.postMessage({ command: 'sendMessage', text });
      input.value = '';
    }

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'addMessage') {
        appendMessage(message.who, message.text || '[Respuesta vacía]');
      } else if (message.command === 'replaceLastMessage') {
        replaceLastMessage(message.who, message.text || '[Respuesta vacía]');
      }
    });

    function appendMessage(who, text, isProcessing = false) {
      const container = document.createElement('div');
      container.className = 'message ' + who + (isProcessing ? ' processing' : '');
      container.textContent = text;
      messagesDiv.appendChild(container);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function replaceLastMessage(who, text) {
      const messages = messagesDiv.querySelectorAll('.message.' + who);
      const lastMessage = messages[messages.length - 1];

      if (lastMessage) {
        lastMessage.textContent = text;
        lastMessage.className = 'message ' + who; // Remover clase 'processing'
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } else {
        // Si no hay mensaje anterior, crear uno nuevo
        appendMessage(who, text);
      }
    }
  </script>
</body>
</html>`;
}