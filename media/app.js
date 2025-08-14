const vscode = acquireVsCodeApi();
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send');
const inputBox = document.getElementById('text');
let pendingDiv = null;

sendBtn.addEventListener('click', () => {
  const text = inputBox.value;
  if (!text) return;
  appendMessage('user', formatMessage(text));
  pendingDiv = appendMessage('assistant', [{ type: 'text', content: 'Procesando respuesta...' }]);
  vscode.postMessage({ command: 'sendMessage', text });
  inputBox.value = '';
});

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.command === 'addMessage') {
    const parts = formatMessage(message.text);
    if (pendingDiv) {
      renderFragments(pendingDiv, parts);
      pendingDiv = null;
    } else {
      appendMessage(message.who, parts);
    }
  }
});

function appendMessage(who, fragments) {
  const div = document.createElement('div');
  div.className = 'message ' + who;
  renderFragments(div, fragments);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return div;
}

function renderFragments(container, fragments) {
  container.textContent = '';
  fragments.forEach((f) => {
    if (f.type === 'code') {
      const pre = document.createElement('pre');
      pre.className = 'code-block';
      pre.textContent = f.content.trim();
      container.appendChild(pre);
    } else {
      const p = document.createElement('p');
      p.textContent = f.content;
      container.appendChild(p);
    }
  });
}
