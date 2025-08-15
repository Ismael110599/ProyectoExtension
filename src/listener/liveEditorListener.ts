import * as vscode from 'vscode';
import { getSuggestions } from '../deepseek/client';
import { log } from '../utils/logger';


let throttleTimer: NodeJS.Timeout | null = null;
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

export function startLiveListener(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('ai-helper');
  context.subscriptions.push(diagnosticCollection);

  const changeDisposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
    const document = event.document;

    // Solo para archivos Python
    if (document.languageId !== 'python') {return;}

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document) {return;}

    const text = document.getText();
    const suggestions = await getSuggestions(text);

    // Mostrar sugerencias como diagnóstico
    const diagnostics: vscode.Diagnostic[] = suggestions.map((suggestion, i) => {
      return new vscode.Diagnostic(
        new vscode.Range(i, 0, i, 1),
        suggestion,
        vscode.DiagnosticSeverity.Information
      );
    });
    diagnosticCollection.set(document.uri, diagnostics);

    // Mostrar sugerencias como decoración (mensaje visual)
    const decorationOptions: vscode.DecorationOptions[] = suggestions.map((s, i) => ({
      range: new vscode.Range(i, 0, i, 0),
      hoverMessage: s
    }));
    editor.setDecorations(suggestionDecorationType, decorationOptions);
  });

  context.subscriptions.push(changeDisposable);
}

// 🧠 Autocompletado para Python
export function registerCompletionProvider(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    ['python'],
    {
      async provideCompletionItems(document, position, token, context) {
        const code = document.getText();
        const suggestions = await getSuggestions(code);

        return suggestions.map(suggestion => {
          const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
          item.detail = 'Sugerencia AI (Kimi)';
          item.insertText = suggestion;
          return item;
        });
      }
    },
    '.' // Trigger character
  );

  context.subscriptions.push(provider);
}
