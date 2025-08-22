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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLiveListener = startLiveListener;
exports.registerCompletionProvider = registerCompletionProvider;
const vscode = __importStar(require("vscode"));
const client_1 = require("../deepseek/client");
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
        if (throttleTimer) {
            clearTimeout(throttleTimer);
        }
        throttleTimer = setTimeout(async () => {
            const lineCount = document.lineCount;
            const suggestions = await Promise.all(Array.from({ length: lineCount }, async (_, i) => {
                const lineText = document.lineAt(i).text;
                if (!lineText.trim()) {
                    return '';
                }
                const [suggestion] = await (0, client_1.getSuggestions)(lineText);
                return shorten(suggestion);
            }));
            const diagnostics = [];
            const decorationOptions = [];
            suggestions.forEach((s, i) => {
                if (!s) {
                    return;
                }
                const range = new vscode.Range(i, 0, i, 1);
                diagnostics.push(new vscode.Diagnostic(range, s, vscode.DiagnosticSeverity.Information));
                decorationOptions.push({ range: new vscode.Range(i, 0, i, 0), hoverMessage: s });
            });
            diagnosticCollection.set(document.uri, diagnostics);
            editor.setDecorations(suggestionDecorationType, decorationOptions);
        }, THROTTLE_DELAY);
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
function shorten(text, maxLength = 80) {
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}
//# sourceMappingURL=liveEditorListener.js.map