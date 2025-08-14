/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const liveEditorListener_1 = __webpack_require__(2);
const examplePanel_1 = __webpack_require__(5);
const tutorView_1 = __webpack_require__(6);
function activate(context) {
    console.log('AI Helper activado');
    (0, liveEditorListener_1.startLiveListener)(context);
    (0, liveEditorListener_1.registerCompletionProvider)(context);
    const tutorProvider = new tutorView_1.TutorViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(tutorView_1.TutorViewProvider.viewType, tutorProvider));
    context.subscriptions.push(vscode.commands.registerCommand('ai-mechanic.openExampleValidator', () => (0, examplePanel_1.openExamplePanel)(context)));
    vscode.window.showInformationMessage('AI Helper listo con DeepSeek!');
}
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.startLiveListener = startLiveListener;
exports.registerCompletionProvider = registerCompletionProvider;
const vscode = __importStar(__webpack_require__(1));
const client_1 = __webpack_require__(3);
let throttleTimer = null;
const THROTTLE_DELAY = 1000; // milisegundos (1s sin escribir)
// 🎨 Decoración para mostrar mensaje fantasma al lado derecho de la línea
const suggestionDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '💡 Sugerencia AI: revisa esta línea',
        color: 'gray',
        margin: '0 0 0 1rem',
    },
    isWholeLine: true
});
function startLiveListener(context) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('ai-helper');
    context.subscriptions.push(diagnosticCollection);
    const changeDisposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
        const document = event.document;
        // Solo para archivos Python
        if (document.languageId !== 'python') {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== document) {
            return;
        }
        const text = document.getText();
        const suggestions = await (0, client_1.getSuggestions)(text);
        // Mostrar sugerencias como diagnóstico
        const diagnostics = suggestions.map((suggestion, i) => {
            return new vscode.Diagnostic(new vscode.Range(i, 0, i, 1), suggestion, vscode.DiagnosticSeverity.Information);
        });
        diagnosticCollection.set(document.uri, diagnostics);
        // Mostrar sugerencias como decoración (mensaje visual)
        const decorationOptions = suggestions.map((s, i) => ({
            range: new vscode.Range(i, 0, i, 0),
            hoverMessage: s
        }));
        editor.setDecorations(suggestionDecorationType, decorationOptions);
    });
    context.subscriptions.push(changeDisposable);
}
// 🧠 Autocompletado para Python
function registerCompletionProvider(context) {
    const provider = vscode.languages.registerCompletionItemProvider(['python'], {
        async provideCompletionItems(document, position, token, context) {
            const code = document.getText();
            const suggestions = await (0, client_1.getSuggestions)(code);
            return suggestions.map(suggestion => {
                const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
                item.detail = 'Sugerencia AI (DeepSeek)';
                item.insertText = suggestion;
                return item;
            });
        }
    }, '.' // Trigger character
    );
    context.subscriptions.push(provider);
}


/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSuggestions = getSuggestions;
exports.chat = chat;
exports.getLesson = getLesson;
const https = __importStar(__webpack_require__(4));
const API_URL = 'https://api.moonshot.ai/v1/chat/completions';
async function callApi(messages) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            model: 'kimi-k2-0711-preview',
            messages,
            stream: false,
        });
        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };
        const req = https.request(API_URL, options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.error) {
                        resolve(`API Error: ${parsed.error.message}`);
                    }
                    else if (parsed.choices &&
                        parsed.choices.length > 0 &&
                        parsed.choices[0].message &&
                        parsed.choices[0].message.content) {
                        resolve(parsed.choices[0].message.content);
                    }
                    else {
                        resolve('Error: Unexpected API response format');
                    }
                }
                catch (e) {
                    console.error('Error parsing DeepSeek response:', e);
                    resolve('Error: Failed to parse API response');
                }
            });
        });
        req.on('error', (error) => {
            console.error('Error en DeepSeek:', error);
            resolve('Error al obtener sugerencias de DeepSeek');
        });
        req.write(data);
        req.end();
    });
}
async function getSuggestions(code) {
    const response = await callApi([{ role: 'user', content: code }]);
    return [response];
}
async function chat(messages) {
    return callApi(messages);
}
const lessonCache = {
    principiante: `Bienvenido al nivel principiante.
1. Repasa la sintaxis básica de Python.
2. Escribe un programa que imprima "Hola Mundo".
3. Declara una variable y muestra su valor.
Ejercicio: crea una función que sume dos números e imprime el resultado.`,
    intermedio: `Bienvenido al nivel intermedio.
1. Revisa listas y bucles.
2. Practica funciones y argumentos.
3. Crea una clase "Persona" con un método "saludar".
Ejercicio: implementa un generador que produzca números pares.`
};
async function getLesson(level) {
    if (lessonCache[level]) {
        return lessonCache[level];
    }
    const prompt = level === 'principiante'
        ? 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante principiante: explica conceptos básicos de programación estructurada y lógica en Python con lenguaje simple, ejemplos muy sencillos paso a paso y un pequeño ejercicio.'
        : 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante intermedio: refuerza conocimientos básicos, introduce programación orientada a objetos y funciones de orden superior, plantea mini-ejercicios que desarrollen la lógica y ofrece ejemplos prácticos.';
    const content = await callApi([{ role: 'user', content: prompt }]);
    lessonCache[level] = content;
    return content;
}


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("https");

/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.openExamplePanel = openExamplePanel;
const vscode = __importStar(__webpack_require__(1));
const client_1 = __webpack_require__(3);
function openExamplePanel(context) {
    const panel = vscode.window.createWebviewPanel('exampleValidator', 'Validador de Ejemplos', vscode.ViewColumn.One, {
        enableScripts: true
    });
    panel.webview.html = getWebviewContent();
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'validate') {
            const suggestions = await (0, client_1.getSuggestions)(message.code);
            panel.webview.postMessage({ command: 'result', suggestions });
        }
    });
    context.subscriptions.push(panel);
}
function getWebviewContent() {
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


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorViewProvider = void 0;
const client_1 = __webpack_require__(3);
class TutorViewProvider {
    context;
    static viewType = 'ai-mechanic.tutorView';
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml();
        const conversation = [];
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'chooseLevel') {
                conversation.length = 0;
                const content = await (0, client_1.getLesson)(message.level);
                conversation.push({ role: 'assistant', content });
                webviewView.webview.postMessage({
                    command: 'addMessage',
                    who: 'assistant',
                    text: content,
                });
            }
            else if (message.command === 'sendMessage') {
                conversation.push({ role: 'user', content: message.text });
                const reply = await (0, client_1.chat)(conversation);
                conversation.push({ role: 'assistant', content: reply });
                webviewView.webview.postMessage({
                    command: 'addMessage',
                    who: 'assistant',
                    text: reply,
                });
            }
        });
    }
    getHtml() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --vscode-foreground: var(--vscode-editor-foreground, #cccccc);
      --vscode-background: var(--vscode-editor-background, #1e1e1e);
      --vscode-input-background: var(--vscode-input-background, #3c3c3c);
      --vscode-input-border: var(--vscode-input-border, #3c3c3c);
      --vscode-button-background: var(--vscode-button-background, #0e639c);
      --vscode-button-hover: var(--vscode-button-hoverBackground, #1177bb);
      --vscode-list-hover: var(--vscode-list-hoverBackground, #2a2d2e);
      --primary-color: #007acc;
      --success-color: #4caf50;
      --user-color: #0078d4;
      --assistant-color: #16825d;
      --border-radius: 8px;
      --shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--vscode-background);
      color: var(--vscode-foreground);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      padding: 20px;
      border-bottom: 1px solid var(--vscode-input-border);
      background: linear-gradient(135deg, var(--primary-color)10, transparent);
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header .subtitle {
      opacity: 0.7;
      font-size: 0.9rem;
    }

    .python-icon {
      width: 24px;
      height: 24px;
      background: linear-gradient(45deg, #3776ab, #ffd343);
      border-radius: 4px;
      display: inline-block;
    }

    .level-selection {
      padding: 20px;
      border-bottom: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
    }

    .level-selection h3 {
      margin-bottom: 15px;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .level-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .level-btn {
      background: var(--vscode-button-background);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
      justify-content: center;
    }

    .level-btn:hover {
      background: var(--vscode-button-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }

    .level-btn.selected {
      background: var(--success-color);
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
    }

    .level-icon {
      font-size: 1.1em;
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      scroll-behavior: smooth;
    }

    .messages::-webkit-scrollbar {
      width: 8px;
    }

    .messages::-webkit-scrollbar-track {
      background: var(--vscode-input-background);
    }

    .messages::-webkit-scrollbar-thumb {
      background: var(--vscode-input-border);
      border-radius: 4px;
    }

    .messages::-webkit-scrollbar-thumb:hover {
      background: var(--primary-color);
    }

    .message {
      margin-bottom: 20px;
      display: flex;
      max-width: 100%;
      animation: messageSlide 0.3s ease-out;
    }

    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      justify-content: flex-end;
    }

    .message.assistant {
      justify-content: flex-start;
    }

    .message-content {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: var(--border-radius);
      position: relative;
      word-wrap: break-word;
      line-height: 1.5;
    }

    .message.user .message-content {
      background: var(--user-color);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant .message-content {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-bottom-left-radius: 4px;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin: 0 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
      flex-shrink: 0;
    }

    .message.user .message-avatar {
      background: var(--user-color);
      color: white;
      order: 1;
    }

    .message.assistant .message-avatar {
      background: var(--assistant-color);
      color: white;
    }

    .input-container {
      padding: 20px;
      border-top: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
    }

    .input-wrapper {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .input-field {
      flex: 1;
      background: var(--vscode-background);
      border: 2px solid var(--vscode-input-border);
      border-radius: var(--border-radius);
      padding: 12px 16px;
      color: var(--vscode-foreground);
      font-size: 0.9rem;
      resize: none;
      max-height: 120px;
      min-height: 44px;
      transition: border-color 0.2s ease;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }

    .send-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 80px;
      justify-content: center;
    }

    .send-btn:hover:not(:disabled) {
      background: var(--vscode-button-hover);
      transform: translateY(-1px);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      opacity: 0.7;
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin-bottom: 8px;
      font-weight: 500;
    }

    .empty-state p {
      opacity: 0.8;
      font-size: 0.9rem;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--vscode-input-background);
      border-radius: var(--border-radius);
      margin-bottom: 20px;
      opacity: 0.8;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      animation: typing 1.4s infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { opacity: 0.3; }
      30% { opacity: 1; }
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .level-buttons {
        flex-direction: column;
      }
      
      .level-btn {
        min-width: 100%;
      }
      
      .message-content {
        max-width: 90%;
      }
      
      .input-wrapper {
        flex-direction: column;
        gap: 8px;
      }
      
      .send-btn {
        align-self: stretch;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>
      <span class="python-icon"></span>
      Asistente de Python
    </h1>
    <div class="subtitle">Tu compañero de aprendizaje inteligente</div>
  </div>

  <div class="level-selection" id="levelSelection">
    <h3>🎯 Selecciona tu nivel de experiencia:</h3>
    <div class="level-buttons">
      <button class="level-btn" id="beginner">
        <span class="level-icon">🌱</span>
        Principiante
      </button>
      <button class="level-btn" id="intermediate">
        <span class="level-icon">⚡</span>
        Intermedio
      </button>
    </div>
  </div>

  <div class="chat-container" id="chatContainer" style="display: none;">
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
        <button class="send-btn" id="sendBtn">
          <span>📤</span>
          Enviar
        </button>
      </div>
    </div>
  </div>

  <script>
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
      document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('selected');
      });
      button.classList.add('selected');

      // Show chat after a short delay
      setTimeout(() => {
        levelSelection.style.display = 'none';
        chatContainer.style.display = 'flex';
        messageInput.focus();
        
        // Clear empty state
        messagesDiv.innerHTML = '';
        
        // Send level to extension
        vscode.postMessage({ command: 'chooseLevel', level: level });
        
        // Add welcome message
        appendMessage('assistant', \`¡Perfecto! Has seleccionado el nivel \${level}. Estoy aquí para ayudarte con Python. ¿Qué te gustaría aprender hoy?\`);
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
      messageDiv.className = \`message \${who}\`;
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = who === 'user' ? '👤' : '🤖';
      
      const content = document.createElement('div');
      content.className = 'message-content';
      content.textContent = text;
      
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
      typingContent.innerHTML = \`
        <span>Escribiendo</span>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      \`;
      
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
  </script>
</body>
</html>`;
    }
}
exports.TutorViewProvider = TutorViewProvider;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map