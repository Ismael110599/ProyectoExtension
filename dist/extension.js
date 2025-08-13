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
    context.subscriptions.push(vscode.commands.registerCommand('ai-mechanic.openExampleValidator', () => (0, examplePanel_1.openExamplePanel)(context)));
    const tutorProvider = new tutorView_1.TutorViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(tutorView_1.TutorViewProvider.viewType, tutorProvider));
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
async function getLesson(level) {
    const prompt = level === 'principiante'
        ? 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante principiante: explica conceptos básicos de programación estructurada y lógica en Python con lenguaje simple, ejemplos muy sencillos paso a paso y un pequeño ejercicio.'
        : 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante intermedio: refuerza conocimientos básicos, introduce programación orientada a objetos y funciones de orden superior, plantea mini-ejercicios que desarrollen la lógica y ofrece ejemplos prácticos.';
    return callApi([{ role: 'user', content: prompt }]);
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
const lessons_1 = __webpack_require__(7);
class TutorViewProvider {
    context;
    static viewType = 'ai-mechanic.tutorView';
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml();
        const lessonIndex = {
            principiante: 0,
            intermedio: 0
        };
        const sendLesson = async (level) => {
            const idx = lessonIndex[level] ?? 0;
            const preset = lessons_1.localLessons[level][idx];
            if (preset) {
                webviewView.webview.postMessage({ command: 'showLesson', content: preset });
                lessonIndex[level] = idx + 1;
            }
            else {
                const content = await (0, client_1.getLesson)(level);
                webviewView.webview.postMessage({ command: 'showLesson', content });
            }
        };
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'chooseLevel') {
                const lvl = message.level;
                lessonIndex[lvl] = 0;
                await sendLesson(lvl);
            }
            else if (message.command === 'nextLesson') {
                const lvl = message.level;
                await sendLesson(lvl);
            }
        });
    }
    getHtml() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 10px; }
    button { margin-right: 8px; }
    #content { white-space: pre-wrap; margin-top: 10px; }
  </style>
</head>
<body>
  <h3>Asistente de Python</h3>
  <div id="level">
    <p>Selecciona tu nivel:</p>
    <button id="beginner">Principiante</button>
    <button id="intermediate">Intermedio</button>
  </div>
  <div id="content"></div>
  <button id="next" style="display:none;">Siguiente</button>
  <script>
    const vscode = acquireVsCodeApi();
    let currentLevel = null;
    document.getElementById('beginner').addEventListener('click', () => {
      currentLevel = 'principiante';
      vscode.postMessage({ command: 'chooseLevel', level: currentLevel });
    });
    document.getElementById('intermediate').addEventListener('click', () => {
      currentLevel = 'intermedio';
      vscode.postMessage({ command: 'chooseLevel', level: currentLevel });
    });
    document.getElementById('next').addEventListener('click', () => {
      vscode.postMessage({ command: 'nextLesson', level: currentLevel });
    });
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'showLesson') {
        document.getElementById('content').textContent = message.content;
        document.getElementById('next').style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
    }
}
exports.TutorViewProvider = TutorViewProvider;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.localLessons = void 0;
exports.localLessons = {
    principiante: [
        `¡Hola! Veo que estás empezando a aprender programación en Python. Vamos a construir las bases poco a poco.

1. **Variables:** Imagina que una variable es una caja donde guardas un dato.

   edad = 10
   nombre = "Ana"

2. **Operaciones básicas:** Puedes hacer cuentas con números.

   a = 2
   b = 3
   suma = a + b  # suma vale 5

*Ejercicio:* Crea una variable con tu edad y otra con tu año de nacimiento. Calcula cuántos años tendrás dentro de 5 años.
`,
        `Excelente. Ahora veamos las **condicionales**.

La estructura básica es:

   edad = 18
   if edad >= 18:
       print("Eres mayor de edad")
   else:
       print("Eres menor")

*Ejercicio:* Escribe un programa que pregunte por un número y diga si es positivo, negativo o cero.`
    ],
    intermedio: [
        `¡Perfecto! Ya tienes una base en Python, así que daremos un paso más para profundizar.

1. **Programación orientada a objetos (POO):**

   class Persona:
       def __init__(self, nombre, edad):
           self.nombre = nombre
           self.edad = edad
       
       def saludar(self):
           return f"Hola, soy {self.nombre} y tengo {self.edad} años"

   persona = Persona("Luis", 25)
   print(persona.saludar())

*Ejercicio:* Crea una clase 'Círculo' con un método que calcule el área.
`,
        `Sigamos con **funciones de orden superior** y estructuras de datos.

   def filtrar_pares(numeros):
       return list(filter(lambda x: x % 2 == 0, numeros))

   lista = [1, 2, 3, 4, 5, 6]
   print(filtrar_pares(lista))  # [2, 4, 6]

*Ejercicio:* Escribe una función que reciba otra función y una lista, y aplique la función a cada elemento.`
    ]
};


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