import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { RGSSScriptSection as ScriptSection } from "./RGSSScriptSection";
import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";
import { Path } from "../utils/Path";

export class ScriptExplorerProvider
    implements vscode.TreeDataProvider<ScriptSection>
{
    constructor(
        private workspaceRoot: string,
        private readonly loggingService: LoggingService
    ) {}

    private _onDidChangeTreeData: vscode.EventEmitter<
        ScriptSection | undefined | null | void
    > = new vscode.EventEmitter<ScriptSection | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        ScriptSection | undefined | null | void
    > = this._onDidChangeTreeData.event;

    /**
     * Refresh the tree data in the script explorer.
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(
        element: ScriptSection
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(
        element?: ScriptSection | undefined
    ): vscode.ProviderResult<ScriptSection[]> {
        if (!this.workspaceRoot) {
            return [];
        }

        return this.parseScriptSectionFromList();
    }

    private createEmptyScriptSection() {
        return new ScriptSection("", vscode.TreeItemCollapsibleState.None);
    }

    /**
     * Parse each lines from a file called 'info.txt' and extract the script title.
     * and then next this method will be created an each script tree data for [vscode.TreeDataProvider](https://code.visualstudio.com/api/references/vscode-api#TreeDataProvider).
     */
    private parseScriptSectionFromList(): ScriptSection[] {
        const targetFilePath = path.join(
            this.workspaceRoot,
            "Scripts",
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
        );

        if (!fs.existsSync(targetFilePath)) {
            this.loggingService.info(
                `Cannot find script list file. Please check the game folder. ${targetFilePath}`
            );
            return [];
        }

        const raw = fs.readFileSync(targetFilePath, "utf8");

        const IGNORE_BLACK_LIST_REGEXP = /(?:Untitled)\_[\d]+/gi;
        const lines = raw.split("\n");
        const scriptSections: ScriptSection[] = [];

        const COLLAPSED = vscode.TreeItemCollapsibleState.None;

        const folderUri = vscode.workspace.workspaceFolders![0].uri;
        const fileUri = folderUri.with({
            path: path.posix.join(folderUri.path, "Scripts"),
        });

        for (const line of lines) {
            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                // scriptSections.push(this.createEmptyScriptSection());
                continue;
            }

            let targetScriptSection = "";

            if (line.endsWith(".rb")) {
                targetScriptSection = line.replace(".rb", "");
            }

            const scriptSection = new ScriptSection(
                targetScriptSection,
                COLLAPSED
            );

            this.loggingService.info(
                fileUri
                    .with({
                        path: path.posix.join(
                            fileUri.path,
                            targetScriptSection + ".rb"
                        ),
                    })
                    .toString()
            );

            scriptSection.command = {
                // command: "rgss-script-compiler.openScript",
                command: "vscode.open",
                title: "Open Script",
                arguments: [
                    fileUri.with({
                        path: path.posix.join(
                            fileUri.path,
                            targetScriptSection + ".rb"
                        ),
                    }),
                ],
            };
            scriptSections.push(scriptSection);
        }

        return scriptSections;
    }
}
