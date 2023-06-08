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
import { DataSourceFactory } from "../models/DataSourceFactory";
import { Script } from "../models/Script";
import { ScriptService } from "../services/ScriptService";

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
    private _scriptService?: ScriptService;

    constructor(
        private workspaceRoot: string,
        private readonly loggingService: LoggingService
    ) {
        this.initWithFileWatcher();
        this.initWithScriptFolderWatcher();
        this._tree = new ScriptTree<ScriptSection>([]);

        this._scriptService = new ScriptService(workspaceRoot, this);
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

    private renameTreeItem(oldItem: ScriptSection, newUrl: vscode.Uri) {
        const label = Path.getFileName(newUrl.fsPath, Path.defaultExt);

        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            label + Path.defaultExt
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

        this._scriptService
            ?.updateByUUID(oldItem.id!, {
                title: label,
                filePath: targetFilePath,
            })
            .then(() => {
                this.loggingService.info(`[INFO] Script updated!`);
            });

        // Replace the target index as new item in the tree
        // this._tree = this._tree?.replaceTree(oldItem.id, newScriptSection);

        this.replaceLineByFilename(oldItem.label, label);

        this.refresh();
        this.refreshListFile();
    }

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

        this.loggingService.info(`uuid: ${this._tree?.uuid}`);
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
        const choice = await vscode.window.showInformationMessage(
            "Do you want to delete this script?",
            "Yes",
            "No"
        );

        if (choice === "No") {
            return;
        }

        this._tree = this._tree?.filter((treeItem) => treeItem.id !== item.id);

        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            Path.getFileName(item.filePath)
        );

        this._watcher?.executeFileAction("onDidDelete", () => {
            // 파일이 존재하면 삭제합니다.
            if (fs.existsSync(targetFilePath)) {
                fs.unlinkSync(targetFilePath);

                if (item.id) {
                    this._scriptService?.deleteByUUID(item.id).then(() => {
                        this.refresh();

                        // Create a new script info file called 'info.txt'
                        this.createScriptInfoFile().then(() => {});
                    });
                }
            }
        });
    }

    /**
     * Add a new script section to the tree data.
     *
     * @param item {ScriptSection} The new script section.
     */
    async addTreeItem(item: ScriptSection): Promise<void> {
        // Enter the script name
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
            const prefix = Path.getFileName(item.filePath).split("-");
            const currentIndex = prefix[0];
            const subPrefix = `${currentIndex}.${Math.floor(
                Math.random() * 1000
            )}-`;

            // Create a new empty script file
            const targetFilePath = path.posix.join(
                this.workspaceRoot,
                this._scriptDirectory,
                subPrefix + result + Path.defaultExt // 098.1-Test.rb
            );

            this._watcher?.executeFileAction("onDidCreate", () => {});

            if (!fs.existsSync(targetFilePath)) {
                fs.writeFileSync(targetFilePath, "", "utf8");
            }

            // 스크립트를 추가할 섹션의 위치를 찾는다.
            const targetIndex = this._tree?.findIndex(
                (treeItem) => treeItem.id === item.id
            );

            // const targetSection = this._tree?.find((treeItem) => treeItem.id === item.id);
            // const {label} = targetSection! ?? '';

            // const items = label.split(/([\d]+)\-(.*)/);
            // const currentIndex = items[1];

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

            // Create a new script.
            const script = new Script(result, targetFilePath);
            script.uuid = copiedItem.id;

            const parent = await this._scriptService?.findOneByUUID(item.id!);

            if (parent) {
                script.parent = parent;
            }

            await this._scriptService?.add(script);

            this.refresh();
            this.refreshListFile();
            // await this.createScriptInfoFile();
        }
    }

    replaceLineByFilename(label: string, newLabel: string) {
        // read the list file
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
        const IGNORE_BLACK_LIST_REGEXP = /^[\d]{3}\-(?:Untitled)\_[\d]+/gi;
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
            `FOUND [${lineIndex}] ${temp} => ${lines[lineIndex]} `
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
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
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
                filename
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

    /**
     * Creates a script information file called 'info.txt', which contains the script title.
     *
     * @returns
     */
    async createScriptInfoFile() {
        // Read all script files.
        const scripts = await this._scriptService?.findAll();

        if (!scripts) {
            return;
        }

        const lines = [] as string[];

        for (const script of scripts) {
            const filename = Path.getFileName(
                decodeURIComponent(script.filePath!)
            );

            lines.push(filename);
            console.log(filename);
        }

        const raw = lines.join("\n");

        // Create the script information file called 'info.txt'
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
        );

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

        const IGNORE_BLACK_LIST_REGEXP = /^[\d]{3}\-(?:Untitled)\_[\d]+/gi;
        const lines = raw.split("\n");
        const scriptSections: ScriptSection[] = [];

        const COLLAPSED = vscode.TreeItemCollapsibleState.None;

        const folderUri = vscode.workspace.workspaceFolders![0].uri;
        const fileUri = folderUri.with({
            path: path.posix.join(folderUri.path, this._scriptDirectory),
        });

        const scripts: Script[] = [];

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
                        targetScriptSection + Path.defaultExt
                    ),
                })
                .toString();

            const stat = fs.statSync(
                fileUri.with({
                    path: Path.join(
                        fileUri.path,
                        targetScriptSection + Path.defaultExt
                    ),
                }).fsPath
            );
            if (stat.size === 0) {
                isEmptyContent = true;
            }

            const scriptSection = new ScriptSection(
                // isEmptyContent
                //     ? ""
                //     : targetScriptSection.replace(/^[\d]{3}\-/, ""),
                targetScriptSection.match(/^[\d]{3}\-(?:Untitled)/g)
                    ? ""
                    : targetScriptSection.replace(/^[\d]{3}\-/, ""),
                COLLAPSED,
                scriptFilePath
            );

            // Create a tree item for the script explorer.
            scriptSection.id = generateUUID();
            scriptSection.command = {
                command: "vscode.open",
                title: MessageHelper.INFO.OPEN_SCRIPT,
                arguments: [scriptFilePath],
            };
            scriptSections.push(scriptSection);

            // Create a script for database.
            const script = new Script();
            script.filePath = scriptFilePath;
            script.title = scriptSection.label;
            script.uuid = scriptSection.id;
            scripts.push(script);
        }

        this._tree = new ScriptTree(scriptSections);

        this.refreshDatabase(scripts);

        return scriptSections;
    }

    async refreshDatabase(scripts: Script[]) {
        await this._scriptService?.create(scripts);
    }
}
