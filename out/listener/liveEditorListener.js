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
//# sourceMappingURL=liveEditorListener.js.map