const vscode = acquireVsCodeApi();
let selectedLevel = null;
let isTyping = false;

// Elements
const levelSelection = document.getElementById('levelSelection');
const chatContainer = document.getElementById('chatContainer');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const beginnerBtn = document.getElementById('beginner');
const intermediateBtn = document.getElementById('intermediate');

// Level selection handlers
beginnerBtn.addEventListener('click', () => selectLevel('principiante', beginnerBtn));
intermediateBtn.addEventListener('click', () => selectLevel('intermedio', intermediateBtn));

// Input handlers
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

// Message handling
window.addEventListener('message', event => {
  const message = event.data;
  if (message.command === 'addMessage') {
    hideTyping();
    appendMessage(message.who, message.text);
  }
});

function selectLevel(level, button) {
  selectedLevel = level;

  // Update button states
  document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');

  // Show chat after a short delay
  setTimeout(() => {
    levelSelection.style.display = 'none';
    chatContainer.style.display = 'flex';
    messageInput.focus();

    // Clear empty state
    messagesDiv.innerHTML = '';

    // Send level to extension
    vscode.postMessage({ command: 'chooseLevel', level });

    // Add welcome message
    appendMessage('assistant', `¡Perfecto! Has seleccionado el nivel ${level}. Estoy aquí para ayudarte con Python. ¿Qué te gustaría aprender hoy?`);
  }, 300);
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isTyping) return;

  appendMessage('user', text);
  showTyping();

  vscode.postMessage({ command: 'sendMessage', text });
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendBtn.disabled = true;
}

function appendMessage(who, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${who}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = who === 'user' ? '👤' : '🤖';

  const content = document.createElement('div');
  content.className = 'message-content';

  const parts = typeof formatMessage === 'function' ? formatMessage(text) : [{ type: 'text', content: text }];
  parts.forEach(part => {
    if (part.type === 'code') {
      const pre = document.createElement('pre');
      pre.className = 'code-block';
      pre.textContent = part.content;
      content.appendChild(pre);
    } else {
      const p = document.createElement('p');
      p.textContent = part.content;
      content.appendChild(p);
    }
  });

  if (who === 'user') {
    messageDiv.appendChild(content);
    messageDiv.appendChild(avatar);
  } else {
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
  }

  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  sendBtn.disabled = false;
}

function showTyping() {
  isTyping = true;
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message assistant';
  typingDiv.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = '🤖';

  const typingContent = document.createElement('div');
  typingContent.className = 'typing-indicator';
  typingContent.innerHTML = `
        <span>Escribiendo</span>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;

  typingDiv.appendChild(avatar);
  typingDiv.appendChild(typingContent);
  messagesDiv.appendChild(typingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTyping() {
  isTyping = false;
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Initialize focus
if (messageInput) {
  messageInput.focus();
}
