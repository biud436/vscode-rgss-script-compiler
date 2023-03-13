/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { RGSSScriptSection as ScriptSection } from "./RGSSScriptSection";
import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";
import { Path } from "../utils/Path";
import { generateUUID } from "../utils/uuid";
import { Validator } from "../utils/Validator";
import { TreeFileWatcher } from "./TreeFileWatcher";
import { ScriptTree } from "./ScriptTree";
import { MessageHelper } from "../common/MessageHelper";

export enum LoggingMarker {
    CREATED = "created",
    CHANGED = "changed",
    DELETED = "deleted",
    RENAME = "rename",
}

export class ScriptExplorerProvider
    implements vscode.TreeDataProvider<ScriptSection>, vscode.Disposable
{
    private _scriptDirectory = "Scripts";
    private _watcher?: TreeFileWatcher;
    private _scriptFolderRootWatcher?: TreeFileWatcher;
    private _tree?: ScriptTree<ScriptSection>;

    constructor(
        private workspaceRoot: string,
        private readonly loggingService: LoggingService
    ) {
        this.initWithFileWatcher();
        this.initWithScriptFolderWatcher();
        this._tree = new ScriptTree<ScriptSection>([]);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        ScriptSection | undefined | null | void
    > = new vscode.EventEmitter<ScriptSection | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        ScriptSection | undefined | null | void
    > = this._onDidChangeTreeData.event;

    /**
     * Create the file watcher for the script directory.
     */
    initWithFileWatcher() {
        this._watcher = new TreeFileWatcher(this.loggingService);

        this._watcher.create();

        this._watcher.onDidRenameFiles.event(({ oldUrl, newUrl }) => {
            this.onDidRenameFiles(oldUrl, newUrl);
        });
        this._watcher.onDidCreate.event((file) => {
            this.onDidCreate(file);
        });
        this._watcher.onDidChange.event((file) => {
            this.onDidChange(file);
        });
        this._watcher.onDidDelete.event((file) => {
            this.onDidDelete(file);
        });
    }

    initWithScriptFolderWatcher() {
        this._scriptFolderRootWatcher = new TreeFileWatcher(
            this.loggingService,
            "**/Scripts"
        );
        this._scriptFolderRootWatcher.create();

        this._scriptFolderRootWatcher.onDidDelete.event((uri) => {
            this.loggingService.info(MessageHelper.INFO.RELOAD_LIST);

            this.refreshExplorer();
        });
    }

    /**
     * Release the file watcher and other resources.
     */
    dispose() {
        this._watcher?.dispose();
        this._scriptFolderRootWatcher?.dispose();
    }

    private onDidRenameFiles(oldUrl: vscode.Uri, newUrl: vscode.Uri) {
        this.loggingService.info(
            `[file ${LoggingMarker.RENAME}] ${JSON.stringify(
                oldUrl
            )} -> ${JSON.stringify(newUrl)}`
        );

        const oldScriptSection = this._tree?.find(
            (item) =>
                Path.getFileName(item.filePath) ===
                Path.getFileName(oldUrl.fsPath)
        );

        if (oldScriptSection) {
        }
    }

    renameTreeItem(oldItem: ScriptSection, newUrl: vscode.Uri) {
        const label = Path.getFileName(newUrl.fsPath, Path.defaultExt);

        // Create a new tree item
        const newScriptSection = new ScriptSection(
            label,
            vscode.TreeItemCollapsibleState.None,
            newUrl.fsPath
        );
        newScriptSection.id = oldItem.id;
        newScriptSection.command = {
            command: "vscode.open",
            title: MessageHelper.INFO.OPEN_SCRIPT,
            arguments: [vscode.Uri.file(newUrl.fsPath)],
        };

        // Replace the target index as new item in the tree
        this._tree = this._tree?.replaceTree(oldItem.id, newScriptSection);
    }

    /**
     * 최악의 상황으로는 두 번 실행될 수 있다.
     *
     * @param url
     */
    private onDidCreate(url: vscode.Uri) {
        this.loggingService.info(
            `[file ${LoggingMarker.CREATED}] ${JSON.stringify(url)}`
        );

        const COLLAPSED = vscode.TreeItemCollapsibleState.None;

        const name = Path.getFileName(url.fsPath, Path.defaultExt);
        const section = new ScriptSection(name, COLLAPSED, url.fsPath);

        section.id = generateUUID();
        section.command = {
            command: "vscode.open",
            title: MessageHelper.INFO.OPEN_SCRIPT,
            arguments: [vscode.Uri.file(url.fsPath)],
        };
    }

    private onDidChange(url: vscode.Uri) {
        this.loggingService.info(
            `[file ${LoggingMarker.CHANGED}] ${JSON.stringify(url)}`
        );
    }

    /**
     * Refresh the script explorer after applying the changes.
     */
    private onDidDelete(url: vscode.Uri) {
        this.loggingService.info(
            `[file ${LoggingMarker.DELETED}] ${JSON.stringify(url)}`
        );

        const scriptSection = this._tree?.find(
            (item) =>
                Path.getFileName(item.filePath) === Path.getFileName(url.fsPath)
        );

        if (scriptSection) {
            this.loggingService.info(MessageHelper.INFO.FOUND_NODE_BE_DELETED);
            this.deleteTreeItem(scriptSection);
        }
    }

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

        if (this._tree?.length === 0) {
            return this.parseScriptSectionFromList();
        }

        return this._tree?.getChildren();
    }

    /**
     * Delete a script section from the tree data.
     *
     * @param item
     */
    async deleteTreeItem(item: ScriptSection): Promise<void> {
        this._tree = this._tree?.filter((treeItem) => treeItem.id !== item.id);

        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            Path.getFileName(item.filePath)
        );

        this._watcher?.executeFileAction("onDidDelete", () => {
            if (fs.existsSync(targetFilePath)) {
                fs.unlinkSync(targetFilePath);
            }
        });

        this.refresh();
        this.refreshListFile();
    }

    /**
     * Add a new script section to the tree data.
     *
     * @param item {ScriptSection} The new script section.
     */
    async addTreeItem(item: ScriptSection): Promise<void> {
        const result = await vscode.window.showInputBox({
            prompt: "Please a new script name.",
            value: MessageHelper.INFO.UNTITLED,
            validateInput: (value: string) => {
                if (!Validator.isStringOrNotEmpty(value)) {
                    return Validator.PLASE_INPUT_SCR_NAME;
                }

                if (!Validator.isValidScriptName(value)) {
                    return Validator.INVALID_SCRIPT_NAME;
                }

                return Validator.VALID;
            },
        });

        if (result) {
            const targetFilePath = path.posix.join(
                this.workspaceRoot,
                this._scriptDirectory,
                result + Path.defaultExt
            );

            this._watcher?.executeFileAction("onDidCreate", () => {
                if (!fs.existsSync(targetFilePath)) {
                    fs.writeFileSync(targetFilePath, "", "utf8");
                }
            });

            const targetIndex = this._tree?.findIndex(
                (treeItem) => treeItem.id === item.id
            );

            const copiedItem = {
                ...item,
            };

            copiedItem.id = generateUUID();
            copiedItem.label = result;
            copiedItem.filePath = targetFilePath;
            copiedItem.command = {
                command: "vscode.open",
                title: MessageHelper.INFO.OPEN_SCRIPT,
                arguments: [vscode.Uri.file(targetFilePath).path],
            };

            this._tree?.splice(targetIndex!, 0, copiedItem);

            this.refresh();
            this.refreshListFile();
        }
    }

    /**
     * Creates the text file called info.txt, which contains the script title.
     * This file is used to display the script title in the script explorer.
     * it is used to packing or unpacking the script in the ruby interpreter.
     */
    async refreshListFile() {
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
        );

        const lines = [];

        for (const { filePath } of this._tree!) {
            const filename = Path.getFileName(filePath);

            if (filename === Path.defaultExt) {
                continue;
            }

            lines.push(decodeURIComponent(filename));
        }

        const raw = lines.join("\n");

        await fs.promises.writeFile(targetFilePath, raw, "utf8");
    }

    refreshExplorer() {
        this._tree = new ScriptTree<ScriptSection>([]);

        this.refresh();
    }

    /**
     * Parse each lines from a file called 'info.txt' and extract the script title.
     * and then next this method will be created an each script tree data.
     */
    private parseScriptSectionFromList(): ScriptSection[] {
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
        );

        if (!fs.existsSync(targetFilePath)) {
            vscode.window.showErrorMessage(
                MessageHelper.ERROR.NOT_FOUND_LIST_FILE
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
            path: path.posix.join(folderUri.path, this._scriptDirectory),
        });

        for (const line of lines) {
            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                continue;
            }

            let targetScriptSection = "";

            if (line.endsWith(Path.defaultExt)) {
                targetScriptSection = line.replace(Path.defaultExt, "");
            }

            const scriptFilePath = fileUri
                .with({
                    path: path.posix.join(
                        fileUri.path,
                        targetScriptSection + Path.defaultExt
                    ),
                })
                .toString();

            const scriptSection = new ScriptSection(
                targetScriptSection,
                COLLAPSED,
                scriptFilePath
            );

            scriptSection.id = generateUUID();
            scriptSection.command = {
                command: "vscode.open",
                title: MessageHelper.INFO.OPEN_SCRIPT,
                arguments: [scriptFilePath],
            };
            scriptSections.push(scriptSection);
        }

        this._tree = new ScriptTree(scriptSections);

        return scriptSections;
    }
}
