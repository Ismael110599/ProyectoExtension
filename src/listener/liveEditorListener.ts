import * as vscode from 'vscode';
import { getSuggestions } from '../deepseek/client';


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

    if (throttleTimer) { clearTimeout(throttleTimer); }
    throttleTimer = setTimeout(async () => {
      const lineCount = document.lineCount;
      const suggestions = await Promise.all(
        Array.from({ length: lineCount }, async (_, i) => {
          const lineText = document.lineAt(i).text;
          if (!lineText.trim()) { return ''; }
          const [suggestion] = await getSuggestions(lineText);
          return shorten(suggestion);
        })
      );

      const diagnostics: vscode.Diagnostic[] = [];
      const decorationOptions: vscode.DecorationOptions[] = [];

      suggestions.forEach((s, i) => {
        if (!s) { return; }
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
export function registerCompletionProvider(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    ['python'],
    {
      async provideCompletionItems(document, position, token, context) {
        const code = document.getText();
        const suggestions = await getSuggestions(code);

        return suggestions.map(suggestion => {
          const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
          item.detail = 'Sugerencia AI (DeepSeek)';
          item.insertText = suggestion;
          return item;
        });
      }
    },
    '.' // Trigger character
  );

  context.subscriptions.push(provider);
}

function shorten(text: string, maxLength = 80): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}
