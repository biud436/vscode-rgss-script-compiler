/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { RGSSScriptSection as ScriptSection } from "./RGSSScriptSection";
import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";
import { Path } from "../utils/Path";
import { v4 as uuidv4 } from "uuid";

export enum LoggingMarker {
  CREATED = "created",
  CHANGED = "changed",
  DELETED = "deleted",
}

export class ScriptExplorerProvider
  implements vscode.TreeDataProvider<ScriptSection>, vscode.Disposable
{
  private _tree: ScriptSection[] = [];
  private _scriptDirectory = "Scripts";
  private _glob = "**/*.rb";
  private _watcher?: vscode.FileSystemWatcher;

  constructor(
    private workspaceRoot: string,
    private readonly loggingService: LoggingService
  ) {
    this.initWithFileWatcher();
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
    this._watcher = vscode.workspace.createFileSystemWatcher(this._glob);

    /**
     * 파일 이름 변경 이벤트
     */
    vscode.workspace.onDidRenameFiles((event) => {
      event.files.forEach((file) => {
        console.log(`${file.oldUri} -> ${file.newUri}`);
      });
    });

    /**
     * 파일 생성 이벤트
     */
    this._watcher.onDidCreate((event) => {
      this.loggingService.info(
        `[file ${LoggingMarker.CREATED}] ${JSON.stringify(event)}`
      );
    });

    /**
     * 파일 변경 이벤트
     */
    this._watcher.onDidChange((event) => {
      this.loggingService.info(
        `[file ${LoggingMarker.CHANGED}] ${JSON.stringify(event)}`
      );
    });

    /**
     * 파일 삭제 이벤트
     */
    this._watcher.onDidDelete((event) => {
      this.loggingService.info(
        `[file ${LoggingMarker.DELETED}] ${JSON.stringify(event)}`
      );
    });
  }

  /**
   * Release the file watcher and other resources.
   */
  dispose() {
    if (this._watcher) {
      this._watcher.dispose();
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

    if (this._tree.length === 0) {
      return this.parseScriptSectionFromList();
    }

    return this._tree;
  }

  /**
   * Delete a script section from the tree data.
   *
   * @param item
   */
  async deleteTreeItem(item: ScriptSection): Promise<void> {
    this._tree = this._tree.filter((treeItem) => treeItem.id !== item.id);

    const targetFilePath = path.join(
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
        if (value.length === 0) {
          return "Please input a script name.";
        }

        if (value.match(/[\s]/)) {
          return "Please remove the space.";
        }

        if (value.match(/[\W]/)) {
          return "Please remove the special characters.";
        }

        return null;
      },
    });

    if (result) {
      const targetFilePath = path.join(
        this.workspaceRoot,
        this._scriptDirectory,
        result + Path.defaultExt
      );

      if (!fs.existsSync(targetFilePath)) {
        fs.writeFileSync(targetFilePath, "", "utf8");
      }

      const targetIndex = this._tree.findIndex(
        (treeItem) => treeItem.id === item.id
      );

      const copiedItem = {
        ...item,
      };

      copiedItem.id = uuidv4();
      copiedItem.label = result;
      copiedItem.filePath = targetFilePath;
      copiedItem.command = {
        command: "vscode.open",
        title: "Open Script",
        arguments: [targetFilePath],
      };

      this._tree.splice(targetIndex, 0, copiedItem);

      this.refresh();
      this.refreshListFile();
    }
  }

  async refreshListFile() {
    const targetFilePath = path.join(
      this.workspaceRoot,
      this._scriptDirectory,
      ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
    );

    const lines = [];

    for (const { filePath } of this._tree) {
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
    this._tree = [];

    this.refresh();
  }

  /**
   * Parse each lines from a file called 'info.txt' and extract the script title.
   * and then next this method will be created an each script tree data for [vscode.TreeDataProvider](https://code.visualstudio.com/api/references/vscode-api#TreeDataProvider).
   */
  private parseScriptSectionFromList(): ScriptSection[] {
    const targetFilePath = path.join(
      this.workspaceRoot,
      this._scriptDirectory,
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

      scriptSection.id = uuidv4();
      scriptSection.command = {
        command: "vscode.open",
        title: "Open Script",
        arguments: [scriptFilePath],
      };
      scriptSections.push(scriptSection);
    }

    this._tree = scriptSections;

    return scriptSections;
  }
}
