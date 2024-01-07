/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { RGSSScriptSection as ScriptSection } from "./RGSSScriptSection";
import { ConfigService } from "../services/ConfigService";
import { LoggingService } from "../services/LoggingService";
import { Path } from "../utils/Path";
import { generateUUID } from "../utils/uuid";
import { Validator } from "../utils/Validator";
import { TreeFileWatcher } from "./TreeFileWatcher";
import { ScriptTree } from "./ScriptTree";
import { MessageHelper } from "../common/MessageHelper";
import { DeleteCommand } from "../commands/DeleteCommand";
import { DependencyProvider } from "./DependencyProvider";
import {
    checkMigrationNeeded,
    showMigrationNeededErrorMessage,
} from "../commands/CheckMigrationNeeded";
import { FileIndexTransformer } from "../common/FileIndexTransformer";

export enum LoggingMarker {
    CREATED = "created",
    CHANGED = "changed",
    DELETED = "deleted",
    RENAME = "rename",
}

export enum DialogOption {
    YES = "Yes",
    NO = "No",
}
const IGNORE_BLACK_LIST_REGEXP = /^[\d]{3}\-(?:Untitled)\_[\d]+/gi;
const DND_TREE_VIEW_ID = "application/vnd.code.tree.rgssScriptViewer";

export class ScriptExplorerProvider
    implements
        vscode.TreeDataProvider<ScriptSection>,
        vscode.TreeDragAndDropController<ScriptSection>,
        vscode.Disposable
{
    dropMimeTypes = [DND_TREE_VIEW_ID];
    dragMimeTypes = ["text/uri-list"];

    private _scriptDirectory = "Scripts";
    private _watcher?: TreeFileWatcher;
    private _scriptFolderRootWatcher?: TreeFileWatcher;
    private _tree?: ScriptTree<ScriptSection>;

    constructor(
        private workspaceRoot: string,
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService,
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
            "**/Scripts",
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
        const oldScriptSection = this._tree?.find((item) => {
            return (
                Path.getFileName(item.label) + ".rb" ===
                Path.getFileName(oldUrl.fsPath)
            );
        });

        if (!oldScriptSection) {
            this.loggingService.info(`[INFO] oldScriptSection not found!`);
            return;
        }

        if (oldScriptSection) {
            this.renameTreeItem(oldScriptSection, newUrl);
        }
    }

    /**
     * 드롭 시 호출되는 이벤트
     *
     * @param target 옮길 위치
     * @param sources 드래그한 트리 노드
     * @param token
     * @returns
     */
    public async handleDrop(
        target: ScriptSection | undefined,
        sources: vscode.DataTransfer,
        token: vscode.CancellationToken,
    ): Promise<void> {
        const transferItem = sources.get(DND_TREE_VIEW_ID);
        if (!transferItem) {
            return;
        }

        this.loggingService.info("target:" + JSON.stringify(target));
        this.loggingService.info(
            "sources:" + JSON.stringify(transferItem.value),
        );
    }

    public handleDrag(
        source: readonly ScriptSection[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken,
    ): void | Thenable<void> {
        dataTransfer.set(DND_TREE_VIEW_ID, new vscode.DataTransferItem(source));
    }

    private renameTreeItem(oldItem: ScriptSection, newUrl: vscode.Uri) {
        const label = Path.getFileName(newUrl.fsPath, Path.defaultExt);

        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            label + Path.defaultExt,
        );

        // Create a new tree item
        const newScriptSection = {
            ...oldItem,
        };

        newScriptSection.id = generateUUID();
        newScriptSection.label = label;
        newScriptSection.filePath = targetFilePath;
        newScriptSection.command = {
            command: "vscode.open",
            title: MessageHelper.INFO.OPEN_SCRIPT,
            arguments: [vscode.Uri.file(targetFilePath).path],
        };

        this.replaceLineByFilename(oldItem.label, label);

        this.refresh();
        this.refreshListFile();
    }

    private onDidCreate(url: vscode.Uri) {
        this.loggingService.info(
            `[file ${LoggingMarker.CREATED}] ${JSON.stringify(url)}`,
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
            `[file ${LoggingMarker.CHANGED}] ${JSON.stringify(url)}`,
        );
    }

    /**
     * Refresh the script explorer after applying the changes.
     */
    private onDidDelete(url: vscode.Uri) {
        this.loggingService.info(
            `[file ${LoggingMarker.DELETED}] ${JSON.stringify(url)}`,
        );

        const scriptSection = this._tree?.find(
            (item) =>
                Path.getFileName(item.filePath) ===
                Path.getFileName(url.fsPath),
        );

        if (scriptSection) {
            this.loggingService.info(MessageHelper.INFO.FOUND_NODE_BE_DELETED);
            this.deleteTreeItem(scriptSection);
        }
    }

    /**
     * 스크립트 탐색기를 갱신합니다.
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();

        this.loggingService.info(`uuid: ${this._tree?.uuid}`);
    }

    getTreeItem(
        element: ScriptSection,
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(
        element?: ScriptSection | undefined,
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
    async deleteTreeItem(
        item: ScriptSection,
        isCopyMode?: boolean,
    ): Promise<void> {
        if (!this._tree || !this._watcher) {
            return;
        }
        const dependencyProvider = new DependencyProvider(
            this._tree,
            this.workspaceRoot,
            this._scriptDirectory,
            this._watcher,
            this,
        );

        const deleteCommand = new DeleteCommand(dependencyProvider);

        await deleteCommand.execute(item, isCopyMode);

        if (!isCopyMode) {
            this.hideActiveScript();
        }
    }

    async changeScriptNameManually(item: ScriptSection) {
        const isCopyMode = true;

        if (await this.addTreeItem(item, isCopyMode)) {
            await this.deleteTreeItem(item, isCopyMode);
        }
    }

    setTree(tree: ScriptTree<ScriptSection>) {
        this._tree = tree;
    }

    getTree(): ScriptTree<ScriptSection> | undefined {
        return this._tree;
    }

    /**
     * Add a new script section to the tree data.
     *
     * @param item {ScriptSection} The new script section.
     */
    async addTreeItem(
        item: ScriptSection,
        isCopyMode?: boolean,
    ): Promise<boolean> {
        // Enter the script name
        const result = await vscode.window.showInputBox({
            prompt: isCopyMode
                ? "Please enter the script name you want to change"
                : "Please a new script name.",
            value: isCopyMode
                ? MessageHelper.INFO.NEW_SCRIPT_NAME
                : MessageHelper.INFO.UNTITLED,
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
            const prefix = Path.getFileName(item.filePath).split("-");
            const subPrefix = FileIndexTransformer.transform(prefix?.[0] ?? "");

            // Create a new empty script file
            const targetFilePath = path.posix.join(
                this.workspaceRoot,
                this._scriptDirectory,
                subPrefix + result + Path.defaultExt, // 098.1-Test.rb
            );

            this.loggingService.info("subPrefix: " + subPrefix);

            this._watcher?.executeFileAction("onDidCreate", () => {});

            let readContents = undefined;
            if (isCopyMode && fs.existsSync(item.filePath)) {
                readContents = fs.readFileSync(item.filePath, "utf8");

                this.loggingService.info(
                    `[INFO] readContents: ${readContents}`,
                );
            }

            if (!fs.existsSync(targetFilePath)) {
                fs.writeFileSync(
                    targetFilePath,
                    readContents ? readContents : "",
                    "utf8",
                );
            }

            const targetIndex = this._tree?.findIndex(
                (treeItem) => treeItem.id === item.id,
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

            this._tree?.splice(targetIndex! + 1, 0, copiedItem);

            this.refresh();
            this.refreshListFile();

            this.showScript(vscode.Uri.file(targetFilePath));

            return true;
        }

        return false;
    }

    /**
     * Show the script file in the editor.
     * @param file
     */
    showScript(file: vscode.Uri) {
        vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        vscode.window.showTextDocument(file);
    }

    /**
     * Hide the active script file in the editor.
     */
    hideActiveScript() {
        vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    }

    replaceLineByFilename(label: string, newLabel: string) {
        // read the list file
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME,
        );

        if (!fs.existsSync(targetFilePath)) {
            vscode.window.showErrorMessage(
                MessageHelper.ERROR.NOT_FOUND_LIST_FILE,
            );
            return [];
        }

        const raw = fs.readFileSync(targetFilePath, "utf8");
        const lines = raw.split("\n");

        let lineIndex = -1;

        for (const line of lines) {
            lineIndex++;
            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                continue;
            }

            let targetScriptSection = "";

            if (line.endsWith(Path.defaultExt)) {
                targetScriptSection = line.replace(Path.defaultExt, "");
            }

            if (targetScriptSection === label) {
                break;
            }
        }

        const temp = lines[lineIndex];
        if (lines[lineIndex]) {
            lines[lineIndex] = newLabel;
        }

        this.loggingService.info(
            `FOUND [${lineIndex}] ${temp} => ${lines[lineIndex]} `,
        );

        return lines;
    }

    /**
     * Creates the text file called info.txt, which contains the script title.
     * This file is used to display the script title in the script explorer.
     * it is used to packing or unpacking the script in the ruby interpreter.
     *
     * @deprecated
     */
    async refreshListFile() {
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME,
        );

        const lines = [];

        // 백업 파일을 생성한다.
        const backupFileName = targetFilePath + ".bak";
        if (fs.existsSync(backupFileName)) {
            fs.unlinkSync(backupFileName);
        }

        await fs.promises.copyFile(targetFilePath, backupFileName);

        for (const { filePath } of this._tree!) {
            // 확장자를 포함하여 파일명을 추출한다.
            const filename = Path.getFileName(decodeURIComponent(filePath));

            // ! FIXME 2023.03.13
            // 파일이 존재하지 않을 때 저장 후 Unpack을 강제로 할 경우, 리스트 파일이 갱신되지 않으면서 모든 파일이 날아가게 된다.
            const realFilePath = path.posix.join(
                this.workspaceRoot,
                this._scriptDirectory,
                filename,
            );

            // ! FIXME 2023.03.13
            // 모든 파일에 대한 유효성 검증은 필요하지만, continue를 하면 버그 시, 리스트 파일이 비어있게 되므로 continue를 하지 않는다.
            if (!fs.existsSync(realFilePath)) {
                this.loggingService.info(`${filePath} not found. continue.`);
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
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME,
        );

        if (!fs.existsSync(targetFilePath)) {
            vscode.window.showErrorMessage(
                MessageHelper.ERROR.NOT_FOUND_LIST_FILE,
            );
            return [];
        }

        const raw = fs.readFileSync(targetFilePath, "utf8");

        const lines = raw.split("\n");
        const scriptSections: ScriptSection[] = [];

        const COLLAPSED = vscode.TreeItemCollapsibleState.None;

        const folderUri = vscode.workspace.workspaceFolders![0].uri;
        const fileUri = folderUri.with({
            path: path.posix.join(folderUri.path, this._scriptDirectory),
        });

        if (checkMigrationNeeded(lines)) {
            showMigrationNeededErrorMessage();
            return [];
        }

        for (const line of lines) {
            let isBlankName = false;
            let isEmptyContent = false;

            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                isBlankName = true;
            }

            let targetScriptSection = "";

            if (line.trim() === "") {
                continue;
            }

            if (line.endsWith(Path.defaultExt)) {
                targetScriptSection = line.replace(Path.defaultExt, "");
            }

            const scriptFilePath = fileUri
                .with({
                    path: path.posix.join(
                        fileUri.path,
                        targetScriptSection + Path.defaultExt,
                    ),
                })
                .toString();

            const stat = fs.statSync(
                fileUri.with({
                    path: Path.join(
                        fileUri.path,
                        targetScriptSection + Path.defaultExt,
                    ),
                }).fsPath,
            );
            if (stat.size === 0) {
                isEmptyContent = true;
            }

            const scriptSection = new ScriptSection(
                targetScriptSection.match(/^[\d]{3}\-(?:Untitled)/g)
                    ? ""
                    : targetScriptSection.replace(/^[\d]{3}\-/, ""),
                COLLAPSED,
                scriptFilePath,
            );

            // Create a tree item for the script explorer.
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
