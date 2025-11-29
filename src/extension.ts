import * as vscode from 'vscode';
import * as path from 'path';

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

function escapePath(newPath: string, original: string): string {
  if (original.startsWith('r"') || original.startsWith("r'")) {
    return 'r"' + newPath.replace(/\\/g, "\\") + '"';
  }
  if (original.includes("\\\\")) {
    return '"' + newPath.replace(/\\/g, "\\\\") + '"';
  }
  if (original.includes("\\")) {
    return '"' + newPath.replace(/\\/g, "\\") + '"';
  }
  return '"' + newPath.replace(/\\/g, "/") + '"';
}

export function activate(context: vscode.ExtensionContext) {
  console.log("AutoPath extension is active!");

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = "AutoPath: Active";
  statusBar.tooltip = "AutoPath is watching file paths";
  statusBar.show();
  context.subscriptions.push(statusBar);

  const watcher = vscode.workspace.onDidRenameFiles(async (event) => {
    for (const file of event.files) {
      const oldAbs = file.oldUri.fsPath;
      const newAbs = file.newUri.fsPath;

      const fileGlobs = ['**/*.py', '**/*.js', '**/*.ts', '**/*.java', '**/*.cpp', '**/*.c', '**/*.r', '**/*.ipynb'];

      for (const glob of fileGlobs) {
        const uris = await vscode.workspace.findFiles(glob);
        for (const uri of uris) {
          try {
            const doc = await vscode.workspace.openTextDocument(uri);
            const edit = new vscode.WorkspaceEdit();
            const docFolder = path.dirname(uri.fsPath);

            let changed = false;
            let debugMessages: string[] = [];

            for (let line = 0; line < doc.lineCount; line++) {
              const lineText = doc.lineAt(line).text;
              const regex = /r?["'](.*?)['"]/g;
              let match: RegExpExecArray | null;

              while ((match = regex.exec(lineText)) !== null) {
                const rawString = match[0];
                const inner = match[1];

                const resolved = path.isAbsolute(inner)
                  ? inner
                  : path.resolve(docFolder, inner);

                if (normalizePath(resolved) === normalizePath(oldAbs)) {
                  // Compute new path correctly
                  let replacementPath: string;
                  if (path.isAbsolute(inner)) {
                    replacementPath = newAbs;
                  } else {
                    replacementPath = path.relative(docFolder, newAbs);
                  }

                  const replacement = escapePath(replacementPath, rawString);
                  const range = new vscode.Range(
                    line,
                    match.index!,
                    line,
                    match.index! + rawString.length
                  );
                  edit.replace(uri, range, replacement);
                  changed = true;

                  debugMessages.push(`OLD: ${inner}\nNEW: ${replacementPath}`);
                }
              }
            }

            if (changed) {
              await vscode.workspace.applyEdit(edit);
              await doc.save();
              vscode.window.showInformationMessage(
                `AutoPath updated paths in ${path.basename(uri.fsPath)}:\n\n${debugMessages.join("\n\n")}`
              );
            }
          } catch (err) {
            console.error(`Error updating ${uri.fsPath}:`, err);
          }
        }
      }
    }
  });

  context.subscriptions.push(watcher);
}

export function deactivate() {}
