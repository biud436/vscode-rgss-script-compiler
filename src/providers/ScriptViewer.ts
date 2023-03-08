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

export enum LoggingMarker {
    CREATED = "created",
    CHANGED = "changed",
    DELETED = "deleted",
}

export class ScriptExplorerProvider
    implements vscode.TreeDataProvider<ScriptSection>, vscode.Disposable
{
    private _scriptDirectory = "Scripts";
    private _watcher?: TreeFileWatcher;
    private _tree?: ScriptTree<ScriptSection>;

    constructor(
        private workspaceRoot: string,
        private readonly loggingService: LoggingService
    ) {
        this.initWithFileWatcher();

        // const n = [1, 2, 3, 4];
        this._tree = new ScriptTree<ScriptSection>([]);

        // for (const i of tree) {
        //     this.loggingService.info(i.toString());
        // }
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
    }

    /**
     * Release the file watcher and other resources.
     */
    dispose() {
        this._watcher?.dispose();
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

        if (fs.existsSync(targetFilePath)) {
            fs.unlinkSync(targetFilePath);
        }

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
            value: "Untitled",
            validateInput: (value: string) => {
                // 입력값이 없을 경우
                if (!Validator.isStringOrNotEmpty(value)) {
                    return Validator.PLASE_INPUT_SCR_NAME;
                }

                // 공백이 포함되어 있을 경우
                if (value.match(/[\s]/)) {
                    return Validator.REMOVE_SPACE;
                }

                // 특수 문자가 포함되어 있을 경우 (한글 포함)
                if (Validator.isSpecialCharacter(value)) {
                    return Validator.REMOVE_SPECIAL_CHARACTER;
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

            // if the file is not exist, it creates a new file called '${result}.rb' to target folder
            if (!fs.existsSync(targetFilePath)) {
                fs.writeFileSync(targetFilePath, "", "utf8");
            }

            const targetIndex = this._tree?.findIndex(
                (treeItem) => treeItem.id === item.id
            );

            // Copy the item and change the id, label, filePath, command object.
            const copiedItem = {
                ...item,
            };

            copiedItem.id = generateUUID();
            copiedItem.label = result;
            copiedItem.filePath = targetFilePath;
            copiedItem.command = {
                command: "vscode.open",
                title: "Open Script",
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
     * and then next this method will be created an each script tree data for [vscode.TreeDataProvider](https://code.visualstudio.com/api/references/vscode-api#TreeDataProvider).
     */
    private parseScriptSectionFromList(): ScriptSection[] {
        // 스크립트 Tree 데이터는 아래 파일에서 각 라인을 파싱하여 생성합니다.
        // 아래 파일은 루비 인터프리터에서 스크립트 언패킹에 성공하면 생성됩니다.
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
        );

        // 파일이 존재하지 않는 경우, 게임 폴더 경로 설정 작업부터 다시 진행해야 합니다.
        // 이 경우에는 빈 배열을 반환합니다.
        if (!fs.existsSync(targetFilePath)) {
            vscode.window.showErrorMessage(
                "Cannot find script list file. Please check the game folder. try to reset the game folder."
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
                title: "Open Script",
                arguments: [scriptFilePath],
            };
            scriptSections.push(scriptSection);
        }

        this._tree = new ScriptTree(scriptSections);

        return scriptSections;
    }
}
