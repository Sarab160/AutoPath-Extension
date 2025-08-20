import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log("AutoPath extension is active!");

    // --- Status Bar Item ---
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = "AutoPath: Active";
    statusBar.tooltip = "AutoPath extension is running";
    statusBar.show();
    context.subscriptions.push(statusBar);

    // --- Watch for file renames ---
    const renameWatcher = vscode.workspace.onDidRenameFiles(async (event) => {
        for (const file of event.files) {
            const oldRelative = vscode.workspace.asRelativePath(file.oldUri);
            const newRelative = vscode.workspace.asRelativePath(file.newUri);

            // File types to scan
            const fileGlobs = [
                '**/*.py',
                '**/*.js',
                '**/*.ts',
                '**/*.java',
                '**/*.cpp',
                '**/*.c',
                '**/*.r',
                '**/*.ipynb'
            ];

            for (const glob of fileGlobs) {
                try {
                    const uris = await vscode.workspace.findFiles(glob);

                    for (const uri of uris) {
                        try {
                            const doc = await vscode.workspace.openTextDocument(uri);
                            const text = doc.getText();

                            if (text.includes(oldRelative)) {
                                const edit = new vscode.WorkspaceEdit();
                                const regex = new RegExp(
                                    oldRelative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                                    "g"
                                );

                                for (let line = 0; line < doc.lineCount; line++) {
                                    const lineText = doc.lineAt(line).text;

                                    // Fresh regex per line to avoid "lastIndex" issue
                                    const matches = [...lineText.matchAll(regex)];
                                    for (const match of matches) {
                                        if (match.index !== undefined) {
                                            const range = new vscode.Range(
                                                line,
                                                match.index,
                                                line,
                                                match.index + oldRelative.length
                                            );
                                            edit.replace(uri, range, newRelative);
                                        }
                                    }
                                }

                                if (!edit.size) continue; // no edits
                                await vscode.workspace.applyEdit(edit);
                                await doc.save();
                            }
                        } catch (err) {
                            console.error(`Error processing file ${uri.fsPath}:`, err);
                        }
                    }
                } catch (err) {
                    console.error(`Error finding files for glob ${glob}:`, err);
                }
            }

            vscode.window.showInformationMessage(
                `AutoPath updated: ${oldRelative} → ${newRelative}`
            );
        }
    });

    context.subscriptions.push(renameWatcher);
}

export function deactivate() {}
