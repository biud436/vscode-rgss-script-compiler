/* eslint-disable @typescript-eslint/naming-convention */
import { ScriptTree } from "../providers/ScriptTree";
import { RGSSScriptSection as ScriptSection } from "../providers/RGSSScriptSection";
import { TreeFileWatcher } from "../providers/TreeFileWatcher";
import { ScriptService } from "../services/ScriptService";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Path } from "../utils/Path";
import { ScriptExplorerProvider } from "../providers/ScriptViewer";

enum DialogOption {
    YES = "Yes",
    NO = "No",
}

export class DeleteCommand {
    constructor(
        private tree: ScriptTree<ScriptSection>,
        private workspaceRoot: string,
        private scriptDirectory: string,
        private watcher: TreeFileWatcher,
        private scriptService: ScriptService,
        private view: ScriptExplorerProvider
    ) {}

    public async execute(item: ScriptSection): Promise<void> {
        const choice = await vscode.window.showInformationMessage(
            "Do you want to delete this script?",
            DialogOption.YES,
            DialogOption.NO
        );

        if (choice === DialogOption.NO) {
            return;
        }

        this.excludeCurrentSelectFileFromTree(item);

        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this.scriptDirectory,
            Path.getFileName(item.filePath)
        );

        this.watcher?.executeFileAction("onDidDelete", () => {
            // if the file exists, it will delete it.
            if (fs.existsSync(targetFilePath)) {
                fs.unlinkSync(targetFilePath);

                if (item.id) {
                    this.scriptService?.deleteByUUID(item.id).then(() => {
                        this.view.refresh();

                        // Create a new script info file called 'info.txt'
                        // this.createScriptInfoFile().then(() => {});
                        this.view.refreshListFile();
                    });
                }
            }
        });
    }

    private excludeCurrentSelectFileFromTree(item: ScriptSection) {
        if (!this.tree) {
            return;
        }

        this.tree = this.tree?.filter((treeItem) => treeItem.id !== item.id);
    }
}
