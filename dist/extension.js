/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
const examplePanel_1 = __webpack_require__(11);
const TutorViewProvider_1 = __webpack_require__(12);
function activate(context) {
    console.log('AI Helper activado');
    (0, liveEditorListener_1.startLiveListener)(context);
    (0, liveEditorListener_1.registerCompletionProvider)(context);
    const tutorProvider = new TutorViewProvider_1.TutorViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(TutorViewProvider_1.TutorViewProvider.viewType, tutorProvider));
    context.subscriptions.push(vscode.commands.registerCommand('ai-mechanic.openExampleValidator', () => (0, examplePanel_1.openExamplePanel)(context)));
    vscode.window.showInformationMessage('AI Helper listo con DeepSeek!');
}
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

"use strict";

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
exports.setApiKey = setApiKey;
exports.hasApiKey = hasApiKey;
exports.getSuggestions = getSuggestions;
exports.chat = chat;
exports.getLesson = getLesson;
exports.analyzeAcademicPerformance = analyzeAcademicPerformance;
const https = __importStar(__webpack_require__(4));
const dotenv = __importStar(__webpack_require__(5));
dotenv.config(); // Cargar variables desde .env
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat'; // Modelo responsivo de DeepSeek
let apiKey = process.env.DEEPSEEK_API_KEY || 'sk-6e0340ecb3cb4a62bed1b117238ee5f4';
function setApiKey(key) {
    apiKey = key;
}
function hasApiKey() {
    return apiKey.length > 0;
}
// Función para validar si es JSON válido
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch (e) {
        return false;
    }
}
// Función para validar estructura de respuesta AI
function validateAIResponse(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        typeof obj.type === 'string' &&
        ['text', 'code', 'lesson', 'error'].includes(obj.type) &&
        typeof obj.content === 'string');
}
// Función para parsear respuesta de la AI
function parseAIResponse(rawResponse) {
    // Intentar parsear como JSON
    if (isValidJSON(rawResponse)) {
        try {
            const parsed = JSON.parse(rawResponse);
            if (validateAIResponse(parsed)) {
                return parsed;
            }
            else {
                console.warn('Respuesta JSON no tiene la estructura esperada:', parsed);
                // Fallback: convertir a formato esperado
                return {
                    type: 'text',
                    content: typeof parsed === 'string' ? parsed : rawResponse
                };
            }
        }
        catch (error) {
            console.error('Error al parsear JSON:', error);
        }
    }
    // Fallback: tratar como texto plano
    return {
        type: 'text',
        content: rawResponse
    };
}
// Función para crear prompts que soliciten JSON
function createJSONPrompt(userMessage, level, responseType = 'chat') {
    const baseJSONInstruction = `

IMPORTANTE: 
- No incluyas texto fuera del JSON
- El campo "content" debe contener toda la explicación principal
- Usa "type": "code" si muestras código Python
- Usa "type": "text" para explicaciones generales
- Usa "type": "lesson" para contenido educativo estructurado
- Usa "type": "error" si hay un problema

Nivel del estudiante: ${level || 'principiante'}
Responde en español latinoamericano, de manera clara y didáctica.
`;
    if (responseType === 'lesson') {
        return [
            {
                role: 'system',
                content: `${baseJSONInstruction}

Eres un tutor experto en Python. Genera una lección estructurada para el nivel ${level}. 
El tipo debe ser "lesson" y el contenido debe incluir explicaciones claras, ejemplos prácticos y ejercicios.`
            },
            {
                role: 'user',
                content: userMessage
            }
        ];
    }
    else {
        return [
            {
                role: 'system',
                content: `${baseJSONInstruction}

Eres un asistente experto en Python. Analiza el código o pregunta del estudiante y responde con:
- "code" si estás mostrando código Python
- "text" si es explicación general o conversación
- "lesson" si es contenido educativo estructurado
- "error" si hay un problema

Si revisas código, identifica errores y explica cómo corregirlos. 
Puedes incluir ejemplos de código corregido en el campo "content" usando formato markdown con triple backticks.`
            },
            {
                role: 'user',
                content: userMessage
            }
        ];
    }
}
// Prompt para respuestas en texto plano
function createTextPrompt(userMessage, level) {
    return [
        {
            role: 'system',
            content: `Eres un asistente experto en Python. ` +
                `Responde en español latinoamericano de forma clara y didáctica. ` +
                `Proporciona la respuesta en texto plano, sin utilizar formato JSON ni envoltorios. ` +
                `Si detectas errores en el código o en la pregunta del usuario, explícalos y ofrece correcciones.` +
                (level ? ` Nivel del usuario: ${level}.` : ''),
        },
        { role: 'user', content: userMessage }
    ];
}
async function callApi(messages) {
    return new Promise((resolve) => {
        if (!apiKey) {
            resolve(JSON.stringify({
                type: 'error',
                content: 'Error: falta la API key de DeepSeek'
            }));
            return;
        }
        const data = JSON.stringify({
            model: MODEL,
            messages,
            stream: false,
        });
        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
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
                        resolve(JSON.stringify({
                            type: 'error',
                            content: `API Error: ${parsed.error.message}`
                        }));
                    }
                    else if (parsed.choices &&
                        parsed.choices.length > 0 &&
                        parsed.choices[0].message &&
                        parsed.choices[0].message.content) {
                        resolve(parsed.choices[0].message.content);
                    }
                    else {
                        resolve(JSON.stringify({
                            type: 'error',
                            content: 'Error: Unexpected API response format'
                        }));
                    }
                }
                catch (e) {
                    console.error('Error parsing DeepSeek response:', e);
                    resolve(JSON.stringify({
                        type: 'error',
                        content: 'Error: Failed to parse API response'
                    }));
                }
            });
        });
        req.on('error', (error) => {
            console.error('Error en DeepSeek:', error);
            resolve(JSON.stringify({
                type: 'error',
                content: 'Error al conectar con DeepSeek'
            }));
        });
        req.write(data);
        req.end();
    });
}
async function getSuggestions(code) {
    const messages = createJSONPrompt(`Revisa este código de Python: ${code}`, 'intermediate', 'chat');
    const response = await callApi(messages);
    const parsedResponse = parseAIResponse(response);
    return [formatResponseForDisplay(parsedResponse)];
}
// ✅ FUNCIÓN PRINCIPAL CORREGIDA
async function chat(messages) {
    try {
        // Obtener el último mensaje del usuario para contexto
        const lastUserMessage = messages[messages.length - 1];
        const userLevel = inferLevelFromConversation(messages);
        // Crear prompt en texto plano
        const textPrompt = createTextPrompt(lastUserMessage?.content || '', userLevel);
        // Añadir contexto de conversación previa (sin el prompt de sistema)
        const conversationHistory = messages.slice(0, -1); // Todos menos el último
        const finalMessages = [
            textPrompt[0], // Sistema
            ...conversationHistory.slice(-4), // Últimos 4 mensajes de contexto
            textPrompt[1] // Usuario actual
        ];
        const rawResponse = await callApi(finalMessages);
        const parsedResponse = parseAIResponse(rawResponse);
        // ✅ Devolver el objeto AIResponse directamente, no como string
        return parsedResponse;
    }
    catch (error) {
        console.error('Error en chat:', error);
        return {
            type: 'error',
            content: `Error en el chat: ${error.message}`
        };
    }
}
// Cache de lecciones actualizado
const lessonCache = {};
async function getLesson(level) {
    // Normalizar nivel
    const normalizedLevel = level === 'beginner' ? 'principiante' :
        level === 'intermediate' ? 'intermedio' : level;
    const cacheKey = `lesson_${normalizedLevel}`;
    if (lessonCache[cacheKey]) {
        return lessonCache[cacheKey];
    }
    try {
        const lessonPrompt = normalizedLevel === 'principiante'
            ? `Genera una lección de Python para principiantes que cubra:
- Sintaxis básica y variables
- Tipos de datos (int, str, bool)
- Operaciones básicas
- Estructura condicional simple (if/else)
- Un ejercicio práctico sencillo
Incluye ejemplos de código y consejos útiles.`
            : `Genera una lección de Python para nivel intermedio que cubra:
- Listas, diccionarios y métodos
- Funciones con parámetros y return
- Programación orientada a objetos básica (clases)
- Manejo de errores try/except
- Un ejercicio práctico con clase
Incluye ejemplos de código y mejores prácticas.`;
        const messages = createJSONPrompt(lessonPrompt, normalizedLevel, 'lesson');
        const rawResponse = await callApi(messages);
        const parsedResponse = parseAIResponse(rawResponse);
        const formattedLesson = formatResponseForDisplay(parsedResponse);
        lessonCache[cacheKey] = formattedLesson;
        return formattedLesson;
    }
    catch (error) {
        console.error('Error al obtener lección:', error);
        // Fallback a lecciones estáticas
        const fallbackLessons = {
            principiante: `# 🐍 Lección de Python - Nivel Principiante`,
            intermedio: `# 🐍 Lección de Python - Nivel Intermedio`
        };
        return fallbackLessons[normalizedLevel] ||
            'Error al cargar la lección. Intenta nuevamente.';
    }
}
// Función auxiliar para inferir nivel del usuario desde la conversación
function inferLevelFromConversation(messages) {
    // Buscar indicadores de nivel en los mensajes
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    if (conversationText.includes('principiante') || conversationText.includes('beginner')) {
        return 'principiante';
    }
    if (conversationText.includes('intermedio') || conversationText.includes('intermediate')) {
        return 'intermedio';
    }
    // Por defecto, asumir principiante
    return 'principiante';
}
// ✅ FUNCIÓN DE FORMATEO MEJORADA
function formatResponseForDisplay(response) {
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
// Construcción del prompt avanzado para análisis FODA
function buildAcademicPrompt(nombreCarrera, datosNotas) {
    let prompt = (`Analizar detalladamente el desempeño académico de los estudiantes en la asignatura de ${nombreCarrera}. ` +
        `Utilizar como fuente de información las actividades registradas en la plataforma institucional LMS UIDE Canvas. ` +
        `Realizar un análisis FODA (Fortalezas, Oportunidades, Debilidades y Amenazas) basado en sus resultados, ` +
        `rúbricas de evaluación, comentarios recibidos, participación y progreso en cada componente. ` +
        `Presentar los hallazgos de forma clara, estructurada y categorizada por estudiante. ` +
        `Incluir recomendaciones específicas y accionables, orientadas a mejorar el proceso de enseñanza-aprendizaje, ` +
        `tanto a nivel individual como grupal.` +
        "\n\nIMPORTANTE: Tu respuesta DEBE ser un JSON válido con la siguiente estructura:\n" +
        "{\n" +
        '  "resumen_general": {\n' +
        '    "promedio_grupo": 0,\n' +
        '    "total_estudiantes": 0,\n' +
        '    "nivel_riesgo_grupo": "string",\n' +
        '    "estado_general_grupo": "string"\n' +
        '  },\n' +
        '  "estudiantes": [\n' +
        '    {\n' +
        '      "nombre": "string",\n' +
        '      "curso": "string",\n' +
        '      "promedio": 0,\n' +
        '      "nivel_riesgo": "string",\n' +
        '      "estado_general": "string",\n' +
        '      "probabilidad_aprobacion": 0,\n' +
        '      "analisis_especifico": {\n' +
        '        "fortalezas": ["string"],\n' +
        '        "debilidades": ["string"],\n' +
        '        "oportunidades": ["string"],\n' +
        '        "amenazas": ["string"]\n' +
        '      },\n' +
        '      "recomendaciones": {\n' +
        '        "inmediatas": ["string"],\n' +
        '        "corto_plazo": ["string"],\n' +
        '        "largo_plazo": ["string"]\n' +
        '      },\n' +
        '      "objetivo_recomendado": "string",\n' +
        '      "estrategia_sugerida": "string",\n' +
        '      "actividades_destacadas": [\n' +
        '        {\n' +
        '          "nombre": "string",\n' +
        '          "nota": 0,\n' +
        '          "max_nota": 0,\n' +
        '          "porcentaje": 0,\n' +
        '          "tipo": "string",\n' +
        '          "comentario": "string"\n' +
        '        }\n' +
        '      ]\n' +
        '    }\n' +
        '  ],\n' +
        '  "recomendaciones_grupales": {\n' +
        '    "mejoras_metodologicas": ["string"],\n' +
        '    "recursos_sugeridos": ["string"],\n' +
        '    "actividades_complementarias": ["string"]\n' +
        '  }\n' +
        "}\n\n" +
        "DATOS DEL ESTUDIANTE:\n");
    for (const estudiante of datosNotas) {
        prompt += `\n👤 ESTUDIANTE: ${estudiante.nombre_estudiante}\n`;
        prompt += `📘 CURSO: ${estudiante.curso}\n`;
        prompt += `📊 PROMEDIO ACTUAL: ${estudiante.promedio ?? 0}%\n`;
        prompt += `📝 ACTIVIDADES EVALUADAS: ${estudiante.actividades_con_nota ?? 0}/${estudiante.total_actividades ?? 0}\n\n`;
        prompt += '📋 DETALLE DE ACTIVIDADES:\n';
        for (const act of estudiante.actividades || []) {
            const porcentaje = act.nota != null && act.max_nota ? (act.nota / act.max_nota) * 100 : 0;
            prompt += `  • ${act.nombre} (${act.tipo.toUpperCase()}): ${act.nota ?? 'N/A'}/${act.max_nota ?? 'N/A'} (${Math.round(porcentaje * 10) / 10}%)\n`;
        }
        prompt += '\n';
    }
    return prompt;
}
const systemAcademicPrompt = 'Eres un experto analista educativo especializado en evaluación del rendimiento académico universitario. ' +
    'Tu análisis debe ser preciso, constructivo y motivacional. Utiliza un lenguaje claro y profesional, ' +
    'pero accesible para estudiantes y docentes. \n\nOBLIGATORIO: Tu respuesta DEBE ser un JSON válido con la estructura especificada. ' +
    'No incluyas texto adicional fuera del JSON. Asegúrate de que el JSON sea válido y completo.';
async function analyzeAcademicPerformance(nombreCarrera, datosNotas) {
    try {
        const userPrompt = buildAcademicPrompt(nombreCarrera, datosNotas);
        const messages = [
            { role: 'system', content: systemAcademicPrompt },
            { role: 'user', content: userPrompt }
        ];
        const raw = await callApi(messages);
        return JSON.parse(raw);
    }
    catch (error) {
        return { error: `Error en el análisis: ${error.message}` };
    }
}


/***/ }),
/* 4 */
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),
/* 5 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const fs = __webpack_require__(6)
const path = __webpack_require__(7)
const os = __webpack_require__(8)
const crypto = __webpack_require__(9)
const packageJson = __webpack_require__(10)

const version = packageJson.version

// Array of tips to display randomly
const TIPS = [
  '🔐 encrypt with Dotenvx: https://dotenvx.com',
  '🔐 prevent committing .env to code: https://dotenvx.com/precommit',
  '🔐 prevent building .env in docker: https://dotenvx.com/prebuild',
  '📡 observe env with Radar: https://dotenvx.com/radar',
  '📡 auto-backup env with Radar: https://dotenvx.com/radar',
  '📡 version env with Radar: https://dotenvx.com/radar',
  '🛠️  run anywhere with `dotenvx run -- yourcommand`',
  '⚙️  specify custom .env file path with { path: \'/custom/path/.env\' }',
  '⚙️  enable debug logging with { debug: true }',
  '⚙️  override existing env vars with { override: true }',
  '⚙️  suppress all logs with { quiet: true }',
  '⚙️  write to custom object with { processEnv: myObject }',
  '⚙️  load multiple .env files with { path: [\'.env.local\', \'.env\'] }'
]

// Get a random tip from the tips array
function _getRandomTip () {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

function supportsAnsi () {
  return process.stdout.isTTY // && process.env.TERM !== 'dumb'
}

function dim (text) {
  return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text
}

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// Parse src into an Object
function parse (src) {
  const obj = {}

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]

    // Default undefined or null to empty string
    let value = (match[2] || '')

    // Remove whitespace
    value = value.trim()

    // Check if double quoted
    const maybeQuote = value[0]

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }

    // Add to object
    obj[key] = value
  }

  return obj
}

function _parseVault (options) {
  options = options || {}

  const vaultPath = _vaultPath(options)
  options.path = vaultPath // parse .env.vault
  const result = DotenvModule.configDotenv(options)
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
    err.code = 'MISSING_DATA'
    throw err
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',')
  const length = keys.length

  let decrypted
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim()

      // Get instructions for decrypt
      const attrs = _instructions(result, key)

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key)

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted)
}

function _warn (message) {
  console.error(`[dotenv@${version}][WARN] ${message}`)
}

function _debug (message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`)
}

function _log (message) {
  console.log(`[dotenv@${version}] ${message}`)
}

function _dotenvKey (options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  // fallback to empty string
  return ''
}

function _instructions (result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }

    throw error
  }

  // Get decrypt key
  const key = uri.password
  if (!key) {
    const err = new Error('INVALID_DOTENV_KEY: Missing key part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    const err = new Error('INVALID_DOTENV_KEY: Missing environment part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`)
    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'
    throw err
  }

  return { ciphertext, key }
}

function _vaultPath (options) {
  let possibleVaultPath = null

  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault')
  }

  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath
  }

  return null
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configVault (options) {
  const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || (options && options.debug))
  const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (debug || !quiet) {
    _log('Loading env from encrypted .env.vault')
  }

  const parsed = DotenvModule._parseVault(options)

  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  DotenvModule.populate(processEnv, parsed, options)

  return { parsed }
}

function configDotenv (options) {
  const dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }
  let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug))
  let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (options && options.encoding) {
    encoding = options.encoding
  } else {
    if (debug) {
      _debug('No encoding is specified. UTF-8 is used by default')
    }
  }

  let optionPaths = [dotenvPath] // default, look for .env
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)]
    } else {
      optionPaths = [] // reset default
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath))
      }
    }
  }

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError
  const parsedAll = {}
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }))

      DotenvModule.populate(parsedAll, parsed, options)
    } catch (e) {
      if (debug) {
        _debug(`Failed to load ${path} ${e.message}`)
      }
      lastError = e
    }
  }

  const populated = DotenvModule.populate(processEnv, parsedAll, options)

  // handle user settings DOTENV_CONFIG_ options inside .env file(s)
  debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug)
  quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet)

  if (debug || !quiet) {
    const keysCount = Object.keys(populated).length
    const shortPaths = []
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath)
        shortPaths.push(relative)
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${filePath} ${e.message}`)
        }
        lastError = e
      }
    }

    _log(`injecting env (${keysCount}) from ${shortPaths.join(',')} ${dim(`-- tip: ${_getRandomTip()}`)}`)
  }

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options)
  }

  const vaultPath = _vaultPath(options)

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`)

    return DotenvModule.configDotenv(options)
  }

  return DotenvModule._configVault(options)
}

function decrypt (encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex')
  let ciphertext = Buffer.from(encrypted, 'base64')

  const nonce = ciphertext.subarray(0, 12)
  const authTag = ciphertext.subarray(-16)
  ciphertext = ciphertext.subarray(12, -16)

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    aesgcm.setAuthTag(authTag)
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError
    const invalidKeyLength = error.message === 'Invalid key length'
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'

    if (isRange || invalidKeyLength) {
      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    } else if (decryptionFailed) {
      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY')
      err.code = 'DECRYPTION_FAILED'
      throw err
    } else {
      throw error
    }
  }
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)
  const populated = {}

  if (typeof parsed !== 'object') {
    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
    err.code = 'OBJECT_REQUIRED'
    throw err
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key]
        populated[key] = parsed[key]
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`)
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`)
        }
      }
    } else {
      processEnv[key] = parsed[key]
      populated[key] = parsed[key]
    }
  }

  return populated
}

const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
}

module.exports.configDotenv = DotenvModule.configDotenv
module.exports._configVault = DotenvModule._configVault
module.exports._parseVault = DotenvModule._parseVault
module.exports.config = DotenvModule.config
module.exports.decrypt = DotenvModule.decrypt
module.exports.parse = DotenvModule.parse
module.exports.populate = DotenvModule.populate

module.exports = DotenvModule


/***/ }),
/* 6 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 7 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 8 */
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),
/* 9 */
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),
/* 10 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"name":"dotenv","version":"17.2.1","description":"Loads environment variables from .env file","main":"lib/main.js","types":"lib/main.d.ts","exports":{".":{"types":"./lib/main.d.ts","require":"./lib/main.js","default":"./lib/main.js"},"./config":"./config.js","./config.js":"./config.js","./lib/env-options":"./lib/env-options.js","./lib/env-options.js":"./lib/env-options.js","./lib/cli-options":"./lib/cli-options.js","./lib/cli-options.js":"./lib/cli-options.js","./package.json":"./package.json"},"scripts":{"dts-check":"tsc --project tests/types/tsconfig.json","lint":"standard","pretest":"npm run lint && npm run dts-check","test":"tap run --allow-empty-coverage --disable-coverage --timeout=60000","test:coverage":"tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov","prerelease":"npm test","release":"standard-version"},"repository":{"type":"git","url":"git://github.com/motdotla/dotenv.git"},"homepage":"https://github.com/motdotla/dotenv#readme","funding":"https://dotenvx.com","keywords":["dotenv","env",".env","environment","variables","config","settings"],"readmeFilename":"README.md","license":"BSD-2-Clause","devDependencies":{"@types/node":"^18.11.3","decache":"^4.6.2","sinon":"^14.0.1","standard":"^17.0.0","standard-version":"^9.5.0","tap":"^19.2.0","typescript":"^4.8.4"},"engines":{"node":">=12"},"browser":{"fs":false}}');

/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
/* 12 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
exports.TutorViewProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
const client_1 = __webpack_require__(3);
class TutorViewProvider {
    context;
    static viewType = 'ai-mechanic.tutorView';
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        const conversation = [];
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'chooseLevel') {
                try {
                    conversation.length = 0;
                    const content = await (0, client_1.getLesson)(message.level);
                    conversation.push({ role: 'assistant', content });
                    webviewView.webview.postMessage({
                        command: 'addMessage',
                        who: 'assistant',
                        text: content,
                    });
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Error al obtener la lección: ${error.message}`);
                }
            }
            else if (message.command === 'sendMessage') {
                try {
                    conversation.push({ role: 'user', content: message.text });
                    const aiResponse = await (0, client_1.chat)(conversation);
                    const reply = formatAIResponse(aiResponse);
                    conversation.push({ role: 'assistant', content: reply });
                    webviewView.webview.postMessage({
                        command: 'addMessage',
                        who: 'assistant',
                        text: reply,
                    });
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Error al procesar el mensaje: ${error.message}`);
                }
            }
        });
    }
    getHtml(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'tutor.css'));
        const appUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'app.js'));
        const formatUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'format.js'));
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
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
    }
    
    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      position: relative;
    }
    
    .input-field {
      flex: 1;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 12px 50px 12px 15px;
      font-size: 15px;
      resize: none;
      min-height: 50px;
      max-height: 150px;
      transition: all 0.2s ease;
      background-color: var(--input-bg);
      color: var(--text-color);
      overflow-y: hidden;
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
    // Auto-resize textarea
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      this.textContent = newTheme === 'dark' ? '🌞' : '🌓';
    });

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '🌞' : '🌓';
  </script>

  <script src="${formatUri}"></script>
  <script src="${appUri}"></script>
</body>
</html>`;
    }
}
exports.TutorViewProvider = TutorViewProvider;
function formatAIResponse(response) {
    let result = response.content;
    if (response.metadata) {
        if (response.metadata.difficulty) {
            const difficultyMap = {
                beginner: 'Principiante',
                intermediate: 'Intermedio',
                advanced: 'Avanzado'
            };
            result += `\n\n(Dificultad: ${difficultyMap[response.metadata.difficulty] || response.metadata.difficulty})`;
        }
        if (response.metadata.examples && response.metadata.examples.length > 0) {
            result += '\n\n📝 Ejemplos:';
            response.metadata.examples.forEach((example, index) => {
                result += `\n${index + 1}. ${example}`;
            });
        }
        if (response.metadata.tips && response.metadata.tips.length > 0) {
            result += '\n\n💡 Tips:';
            response.metadata.tips.forEach(tip => {
                result += `\n• ${tip}`;
            });
        }
    }
    return result.trim();
}


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