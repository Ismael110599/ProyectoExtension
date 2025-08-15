import * as vscode from 'vscode';
import { chat, ChatMessage, setApiKey, hasApiKey, AIResponse, analyzeAcademicPerformance, AcademicReport } from '../deepseek/client';

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
        const aiResponse = await chat(conversation);
        const reply = formatAIResponse(aiResponse);
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
// Formatear respuesta AI para mostrar
// ============================================
function formatAIResponse(response: AIResponse): string {
  let result = response.content;

  // Agregar metadata formateada
  if (response.metadata) {
    // Agregar dificultad si existe
    if (response.metadata.difficulty) {
      const difficultyMap = {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado'
      };
      result += `\n\n(Dificultad: ${difficultyMap[response.metadata.difficulty] || response.metadata.difficulty})`;
    }

    // Agregar ejemplos si existen
    if (response.metadata.examples && response.metadata.examples.length > 0) {
      result += '\n\n📝 Ejemplos:';
      response.metadata.examples.forEach((example, index) => {
        result += `\n${index + 1}. ${example}`;
      });
    }

    // Agregar tips si existen
    if (response.metadata.tips && response.metadata.tips.length > 0) {
      result += '\n\n💡 Tips:';
      response.metadata.tips.forEach(tip => {
        result += `\n• ${tip}`;
      });
    }
  }

  return result.trim();
}

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
    }
    #messages {
      flex: 1;
      border: 1px solid #ccc;
      overflow-y: auto;
      padding: 10px;
      background: #1e1e1e;
      color: #dcdcdc;
    }
    .message { 
      margin: 10px 0; 
      white-space: pre-wrap; 
      line-height: 1.5;
    }
    .user { 
      color: #4fc3f7; 
      font-weight: bold;
    }
    .assistant { 
      color: #81c784; 
    }
    .processing {
      color: #ffa726;
      font-style: italic;
    }
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
      border-radius: 4px;
    }
    #input button {
      margin-left: 10px;
      background: #4fc3f7;
      border: none;
      color: #000;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
    }
    #input button:hover {
      background: #29b6f6;
    }
    pre {
      background-color: #121212;
      color: #dcdcdc;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <h3 style="padding:10px;background:#222;margin:0;color:#fff">💬 Chat con AI</h3>
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

    function formatMessage(text) {
      // Detectar bloques de código con triple backticks
      const regex = /\`\`\`([\\s\\S]*?)\`\`\`/g;
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
      
      return parts.length > 0 ? parts : [{ type: 'text', content: text }];
    }

    function appendMessage(who, text, isProcessing = false) {
      const container = document.createElement('div');  
      container.className = 'message ' + who + (isProcessing ? ' processing' : '');

      const parts = formatMessage(text);
      parts.forEach(part => {
        if (part.type === 'code' && part.content) {
          const pre = document.createElement('pre');
          pre.textContent = part.content;
          container.appendChild(pre);
        } else if (part.content) {
          const div = document.createElement('div');
          div.textContent = part.content;
          container.appendChild(div);
        }
      });

      messagesDiv.appendChild(container);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function replaceLastMessage(who, text) {
      const messages = messagesDiv.querySelectorAll('.message.' + who);
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage) {
        // Limpiar el contenido anterior
        lastMessage.innerHTML = '';
        lastMessage.className = 'message ' + who; // Remover clase 'processing'

        const parts = formatMessage(text);
        parts.forEach(part => {
          if (part.type === 'code' && part.content) {
            const pre = document.createElement('pre');
            pre.textContent = part.content;
            lastMessage.appendChild(pre);
          } else if (part.content) {
            const div = document.createElement('div');
            div.textContent = part.content;
            lastMessage.appendChild(div);
          }
        });

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