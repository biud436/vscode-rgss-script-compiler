/* eslint-disable @typescript-eslint/naming-convention */
import { RGSSScriptSection as ScriptSection } from "../providers/RGSSScriptSection";
import * as vscode from "vscode";
import * as fs from "fs";
import { DependencyProvider } from "../providers/DependencyProvider";
import { MenuCommand } from "./MenuCommand";

enum DialogOption {
    YES = "Yes",
    NO = "No",
}

/**
 * DeleteCommand allows you to delete a script from the tree safely.
 * it is also responsible for updating the list file after deleting the script.
 *
 * @class DeleteCommand
 */
export class DeleteCommand extends MenuCommand {
    constructor(protected dependencyProvider: DependencyProvider) {
        super(dependencyProvider);
    }

    /**
     * This method allows you to delete a script from the tree safely.
     *
     * @param item
     * @returns
     */
    public async execute(
        item: ScriptSection,
        isCopyMode?: boolean,
    ): Promise<void> {
        if (!isCopyMode) {
            const choice = await vscode.window.showInformationMessage(
                "Do you want to delete this script?",
                DialogOption.YES,
                DialogOption.NO,
            );

            if (choice === DialogOption.NO) {
                return;
            }
        }

        this.excludeCurrentSelectFileFromTree(item);

        const targetFilePath = this.getItemFilePath(item);

        try {
            await this.createListFile(targetFilePath, item);
            await this.view.refreshListFile();
            await vscode.commands.executeCommand(
                "rgss-script-compiler.compile",
            );
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    /**
     * Exclude the current selected file from the tree.
     *
     * @param item
     * @returns
     */
    private excludeCurrentSelectFileFromTree(item: ScriptSection) {
        if (!this.tree) {
            return;
        }

        this.tree = this.tree.filter((treeItem) => treeItem.id !== item.id);
    }

    private createListFile(targetFilePath: string, item: ScriptSection) {
        return new Promise((resolve, reject) => {
            this.watcher.executeFileAction("onDidDelete", () => {
                if (fs.existsSync(targetFilePath)) {
                    fs.unlink(targetFilePath, (err) => {
                        if (item.id) {
                            this.view.refresh();
                            resolve(item.id);
                        }

                        if (err) {
                            reject(err);
                        }
                    });
                }
            });
        });
    }
}
