import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

function normalizePath(p: string): string {
    return p.replace(/\\/g, "/").toLowerCase();
}

function escapePath(newPath: string, original: string): string {
    if (original.startsWith("r\"") || original.startsWith("r'")) {
        return "r\"" + newPath.replace(/\\/g, "\\") + "\"";
    }
    if (original.includes("\\\\")) {
        return "\"" + newPath.replace(/\\/g, "\\\\") + "\"";
    }
    if (original.includes("\\")) {
        return "\"" + newPath.replace(/\\/g, "\\") + "\"";
    }
    return "\"" + newPath.replace(/\\/g, "/") + "\"";
}

export function activate(context: vscode.ExtensionContext) {
    console.log("AutoPath extension is active!");

    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = "AutoPath: Active";
    statusBar.tooltip = "AutoPath is watching file paths";
    statusBar.show();
    context.subscriptions.push(statusBar);

    const fileGlobs = ['**/*.py', '**/*.js', '**/*.ts', '**/*.java', '**/*.cpp', '**/*.c', '**/*.r', '**/*.ipynb'];

    // -------------------------------
    // Watch VS Code rename events
    // -------------------------------
    const watcher = vscode.workspace.onDidRenameFiles(async (event) => {
        for (const file of event.files) {
            await updatePathsInWorkspace(file.oldUri.fsPath, file.newUri.fsPath, true);
        }
    });
    context.subscriptions.push(watcher);

    // -------------------------------
    // Broken path auto-fix command
    // -------------------------------
    const brokenPathCommand = vscode.commands.registerCommand('autopath.fixBrokenPaths', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("Open a file to fix broken paths.");
            return;
        }
        const doc = editor.document;
        await fixBrokenPathsInDocument(doc);
    });
    context.subscriptions.push(brokenPathCommand);

    // -------------------------------
    // Auto-detect file moves in Windows Explorer
    // -------------------------------
    if (vscode.workspace.workspaceFolders) {
        const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const deletedFiles = new Map<string, string>(); // Map<basename, full old path>

        const explorerWatcher = chokidar.watch(rootPath, { ignoreInitial: true, persistent: true });

        explorerWatcher.on('unlink', filePath => {
            deletedFiles.set(filePath, filePath);
        });

        explorerWatcher.on('add', async filePath => {
            setTimeout(async () => {
                const movedEntry = Array.from(deletedFiles.entries()).find(([oldFullPath]) =>
                    path.basename(oldFullPath) === path.basename(filePath)
                );
                if (movedEntry) {
                    const [oldFullPath] = movedEntry;
                    deletedFiles.delete(oldFullPath);
                    await updatePathsInWorkspace(oldFullPath, filePath, true);
                }
            }, 300);
        });

        context.subscriptions.push({
            dispose: () => explorerWatcher.close()
        });
    }
}

// -------------------------------
// Helper: Update paths in workspace automatically with info popup
// -------------------------------
async function updatePathsInWorkspace(oldAbs: string, newAbs: string, showNotification: boolean = false) {
    const fileGlobs = ['**/*.py', '**/*.js', '**/*.ts', '**/*.java', '**/*.cpp', '**/*.c', '**/*.r', '**/*.ipynb'];
    let totalUpdatedFiles = 0;
    let updateLogs: string[] = [];

    for (const glob of fileGlobs) {
        const uris = await vscode.workspace.findFiles(glob);
        for (const uri of uris) {
            try {
                const doc = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(doc, { preview: false });
                const docFolder = path.dirname(uri.fsPath);
                let changed = false;

                for (let line = 0; line < doc.lineCount; line++) {
                    const lineText = doc.lineAt(line).text;
                    const regex = /r?["'`](.*?)[`'"]/g;
                    let match;
                    while ((match = regex.exec(lineText)) !== null) {
                        const rawString = match[0];
                        const inner = match[1];
                        const resolved = path.isAbsolute(inner) ? inner : path.resolve(docFolder, inner);

                        if (normalizePath(resolved) === normalizePath(oldAbs)) {
                            let replacementPath = path.isAbsolute(inner)
                                ? newAbs
                                : path.relative(docFolder, newAbs).replace(/\\/g, "/");
                            const replacement = escapePath(replacementPath, rawString);

                            const range = new vscode.Range(line, match.index!, line, match.index! + rawString.length);
                            await editor.edit(editBuilder => editBuilder.replace(range, replacement));
                            changed = true;

                            // log this replacement for popup
                            updateLogs.push(`${inner} → ${replacementPath}`);
                        }
                    }
                }

                if (changed) {
                    await doc.save();
                    totalUpdatedFiles++;
                }
            } catch (err) {
                console.error(`Error updating ${uri.fsPath}:`, err);
            }
        }
    }

    if (showNotification && updateLogs.length > 0) {
        // Show popup in lower right with all updates
        vscode.window.showInformationMessage(
            `AutoPath updated ${updateLogs.length} paths:\n` + updateLogs.join('\n')
        );
    }
}

// -------------------------------
// Helper: Fix broken paths automatically
// -------------------------------
async function fixBrokenPathsInDocument(doc: vscode.TextDocument) {
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    const docFolder = path.dirname(doc.uri.fsPath);
    let changed = false;
    let updateLogs: string[] = [];

    for (let line = 0; line < doc.lineCount; line++) {
        const lineText = doc.lineAt(line).text;
        const regex = /r?["'`](.*?)[`'"]/g;
        let match;
        while ((match = regex.exec(lineText)) !== null) {
            const rawString = match[0];
            const inner = match[1];
            const resolvedPath = path.isAbsolute(inner) ? inner : path.resolve(docFolder, inner);

            if (!fs.existsSync(resolvedPath)) {
                const workspaceFiles = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**', 500);
                const foundFiles = workspaceFiles.filter(f => normalizePath(f.fsPath).includes(path.basename(inner).toLowerCase()));

                if (foundFiles.length > 0) {
                    const replacementPath = path.isAbsolute(inner)
                        ? foundFiles[0].fsPath
                        : path.relative(docFolder, foundFiles[0].fsPath).replace(/\\/g, "/");
                    const replacement = escapePath(replacementPath, rawString);
                    const range = new vscode.Range(line, match.index!, line, match.index! + rawString.length);
                    await editor.edit(editBuilder => editBuilder.replace(range, replacement));
                    changed = true;
                    updateLogs.push(`${inner} → ${replacementPath}`);
                }
            }
        }
    }

    if (changed) {
        await doc.save();
        vscode.window.showInformationMessage(
            `AutoPath fixed broken paths:\n` + updateLogs.join('\n')
        );
    } else {
        vscode.window.showInformationMessage("AutoPath: No broken paths detected.");
    }
}

export function deactivate() {}
