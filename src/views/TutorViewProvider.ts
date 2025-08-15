import * as vscode from 'vscode';
import { getLesson, chat, ChatMessage } from '../deepseek/client';

export class TutorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ai-mechanic.tutorView';

  constructor(private readonly context: vscode.ExtensionContext) { }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    const conversation: ChatMessage[] = [];

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'chooseLevel') {
        try {
          conversation.length = 0;
          const content = await getLesson(message.level);
          conversation.push({ role: 'assistant', content });
          webviewView.webview.postMessage({
            command: 'addMessage',
            who: 'assistant',
            text: content,
          });
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error al obtener la lección: ${(error as Error).message}`
          );
        }
      } else if (message.command === 'sendMessage') {
        try {
          conversation.push({ role: 'user', content: message.text });
          const reply = await chat(conversation);
          conversation.push({ role: 'assistant', content: reply });
          webviewView.webview.postMessage({
            command: 'addMessage',
            who: 'assistant',
            text: reply,
          });
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error al procesar el mensaje: ${(error as Error).message}`
          );
        }
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'tutor.css')
    );
    const appUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'app.js')
    );
    const formatUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'format.js')
    );

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Asistente de Python</title>
  <style>
    :root {
      /* Light Theme */
      --primary-color: #2b579a;
      --secondary-color: #1e3f6f;
      --accent-color: #4fc3f7;
      --text-color: #333333;
      --bg-color: #f5f5f5;
      --card-bg: #ffffff;
      --input-bg: #ffffff;
      --border-color: #e0e0e0;
      --shadow-color: rgba(0, 0, 0, 0.08);
      --success-color: #4caf50;
    }

    [data-theme="dark"] {
      /* Dark Theme */
      --primary-color: #4fc3f7;
      --secondary-color: #2b579a;
      --accent-color: #1e3f6f;
      --text-color: #f0f0f0;
      --bg-color: #121212;
      --card-bg: #1e1e1e;
      --input-bg: #252525;
      --border-color: #333333;
      --shadow-color: rgba(0, 0, 0, 0.3);
      --success-color: #81c784;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      transition: background-color 0.3s, color 0.3s, border-color 0.3s;
    }
    
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
      min-height: 100vh;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      position: relative;
    }
    
    .theme-toggle {
      position: absolute;
      right: 0;
      top: 0;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--text-color);
      padding: 5px;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .theme-toggle:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .header h1 {
      color: var(--primary-color);
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .python-icon {
      display: inline-block;
      width: 32px;
      height: 32px;
      background-color: var(--primary-color);
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M15.885 14.788c-4.273 0-4.273-2.115-4.273-2.115v-5.38h4.181s3.024.067 3.024 3.159c0 3.092-2.932 4.336-2.932 4.336zm-1.369-7.634c-.786 0-1.424-.638-1.424-1.424s.638-1.424 1.424-1.424 1.424.638 1.424 1.424-.638 1.424-1.424 1.424z'/%3E%3Cpath d='M16.115 15.212c4.273 0 4.273 2.115 4.273 2.115v5.38h-4.181s-3.024-.067-3.024-3.159c0-3.092 2.932-4.336 2.932-4.336zm1.369 7.634c.786 0 1.424.638 1.424 1.424s-.638 1.424-1.424 1.424-1.424-.638-1.424-1.424.638-1.424 1.424-1.424z'/%3E%3C/svg%3E") no-repeat center;
      margin-right: 10px;
    }
    
    .subtitle {
      color: var(--text-color);
      opacity: 0.8;
      font-size: 16px;
      font-weight: 400;
    }
    
    .level-selection {
      background-color: var(--card-bg);
      border-radius: 8px;
      padding: 25px;
      box-shadow: 0 2px 10px var(--shadow-color);
      margin-bottom: 30px;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    
    .level-selection h3 {
      color: var(--primary-color);
      margin-bottom: 20px;
      font-size: 18px;
      font-weight: 500;
    }
    
    .level-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .level-btn {
      background-color: var(--card-bg);
      border: 2px solid var(--primary-color);
      color: var(--primary-color);
      padding: 15px 25px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      min-width: 180px;
      justify-content: center;
    }
    
    .level-btn:hover {
      background-color: var(--primary-color);
      color: var(--card-bg);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px var(--shadow-color);
    }
    
    .level-icon {
      margin-right: 10px;
      font-size: 20px;
    }
    
    .chat-container {
      background-color: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 2px 10px var(--shadow-color);
      overflow: hidden;
      display: none;
      border: 1px solid var(--border-color);
    }
    
    .messages {
      height: 500px;
      overflow-y: auto;
      padding: 20px;
      background-color: var(--card-bg);
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-color);
      opacity: 0.7;
    }
    
    .empty-state-icon {
      font-size: 50px;
      margin-bottom: 20px;
      opacity: 0.5;
    }
    
    .empty-state h3 {
      color: var(--primary-color);
      margin-bottom: 10px;
      font-weight: 500;
    }
    
    .input-container {
      border-top: 1px solid var(--border-color);
      padding: 15px;
      background-color: var(--card-bg);
      width: 100%;
    }
    
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      width: 100%;
    }
    
    .input-field {
      width: 100%;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 12px 50px 12px 15px;
      font-size: 15px;
      resize: none;
      min-height: 50px;
      max-height: 150px;
      background-color: var(--input-bg);
      color: var(--text-color);
      overflow-y: hidden;
      box-sizing: border-box;
      transition: height 0.2s ease;
    }
    
    .input-field:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
    }
    
    .send-btn {
      position: absolute;
      right: 10px;
      bottom: 10px;
      background-color: var(--primary-color);
      color: var(--card-bg);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    
    .send-btn:hover {
      background-color: var(--secondary-color);
      transform: scale(1.05);
    }
    
    .send-btn:active {
      transform: scale(0.98);
    }
    
    /* Chat bubbles */
    .message {
      margin-bottom: 15px;
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.4;
      position: relative;
      clear: both;
    }
    
    .user-message {
      background-color: var(--primary-color);
      color: white;
      float: right;
      border-bottom-right-radius: 4px;
    }
    
    .assistant-message {
      background-color: var(--border-color);
      color: var(--text-color);
      float: left;
      border-bottom-left-radius: 4px;
    }
    
    @media (max-width: 768px) {
      body {
        padding: 15px;
      }
      
      .header h1 {
        font-size: 24px;
        padding-right: 30px;
      }
      
      .level-buttons {
        flex-direction: column;
        gap: 12px;
      }
      
      .level-btn {
        width: 100%;
      }
      
      .messages {
        height: 400px;
        padding: 15px;
      }
      
      .message {
        max-width: 90%;
      }
      
      .input-field {
        padding-right: 45px;
      }
      
      .send-btn {
        width: 36px;
        height: 36px;
        right: 8px;
        bottom: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <button class="theme-toggle" id="themeToggle">🌓</button>
    <h1>
      <span class="python-icon"></span>
      Asistente de Python
    </h1>
    <div class="subtitle">Tu compañero de aprendizaje inteligente</div>
  </div>

  <div class="level-selection" id="levelSelection">
    <h3>Selecciona tu nivel de experiencia</h3>
    <div class="level-buttons">
      <button class="level-btn" data-level="beginner">
        <span class="level-icon">🌱</span>
        Principiante
      </button>
      <button class="level-btn" data-level="intermediate">
        <span class="level-icon">⚡</span>
        Intermedio
      </button>
    </div>
  </div>

  <div class="chat-container" id="chatContainer">
    <div class="messages" id="messages">
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <h3>¡Comencemos a aprender Python!</h3>
        <p>Escribe tu pregunta o duda y te ayudaré paso a paso</p>
      </div>
    </div>

    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          id="messageInput"
          class="input-field"
          placeholder="Escribe tu pregunta sobre Python..."
          rows="1"
        ></textarea>
        <button class="send-btn" id="sendBtn" title="Enviar">
          <span>➤</span>
        </button>
      </div>
    </div>
  </div>

  <script>
    // VSCode API
    const vscode = acquireVsCodeApi();
    
    // Auto-resize textarea
    const textarea = document.getElementById('messageInput');
    
    function adjustTextareaHeight() {
      textarea.style.height = 'auto';
      const computed = window.getComputedStyle(textarea);
      const height = parseInt(computed.getPropertyValue('border-top-width'), 10) +
                   parseInt(computed.getPropertyValue('padding-top'), 10) +
                   textarea.scrollHeight +
                   parseInt(computed.getPropertyValue('padding-bottom'), 10) +
                   parseInt(computed.getPropertyValue('border-bottom-width'), 10);
      
      textarea.style.height = height + 'px';
      
      if (height > 150) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
    
    textarea.addEventListener('input', adjustTextareaHeight);
    adjustTextareaHeight();
    window.addEventListener('resize', adjustTextareaHeight);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      vscode.setState({ theme: newTheme });
      this.textContent = newTheme === 'dark' ? '🌞' : '🌓';
    });

    // Restore theme
    const state = vscode.getState();
    const savedTheme = state?.theme || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '🌞' : '🌓';

    // Chat elements
    const sendBtn = document.getElementById('sendBtn');
    const messagesContainer = document.getElementById('messages');
    const chatContainer = document.getElementById('chatContainer');
    const levelSelection = document.getElementById('levelSelection');

    // Level selection
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const level = e.currentTarget.getAttribute('data-level');
        vscode.postMessage({
          command: 'chooseLevel',
          level: level
        });
        showChat();
      });
    });

    function showChat() {
      levelSelection.style.display = 'none';
      chatContainer.style.display = 'block';
    }

    function addMessage(sender, message) {
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    // Detectar si el mensaje es JSON válido
    let content = message;
    let isJSON = false;
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object' && parsed.content) {
        content = parsed.content;
        isJSON = true;
      }
    } catch {}

    // Estilos según tipo
    if (sender === 'user') {
      messageDiv.classList.add('user-message');
    } else {
      messageDiv.classList.add('assistant-message');
      if (!isJSON) {
        // Si no es JSON, poner fondo más claro y texto azul
        messageDiv.style.backgroundColor = '#e0f7fa';
        messageDiv.style.color = '#006064';
      }
    }

    // Permitir texto multilínea
    messageDiv.innerHTML = content.replace(/\n/g, '<br>');

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Escuchar mensajes desde la extensión
  window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'addMessage') {
      addMessage(message.who, message.text);
    }
  });

    // Send message
    function sendMessage() {
      const message = textarea.value.trim();
      if (message) {
        addMessage('user', message);
        vscode.postMessage({
          command: 'sendMessage',
          text: message
        });
        textarea.value = '';
        adjustTextareaHeight();
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    textarea.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'addMessage') {
        addMessage(message.who, message.text);
      }
    });
  </script>
</body>
</html>`;
  }
}