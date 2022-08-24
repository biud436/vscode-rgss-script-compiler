import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { RGSSScriptSection } from "./RGSSScriptSection";
import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";

export class ScriptViewerProvider
  implements vscode.TreeDataProvider<RGSSScriptSection>
{
  constructor(
    private workspaceRoot: string,
    private readonly loggingService: LoggingService
  ) {}

  private _onDidChangeTreeData: vscode.EventEmitter<
    RGSSScriptSection | undefined | null | void
  > = new vscode.EventEmitter<RGSSScriptSection | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    RGSSScriptSection | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: RGSSScriptSection
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: RGSSScriptSection | undefined
  ): vscode.ProviderResult<RGSSScriptSection[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    return this.parseScriptSectionFromList();
  }

  private createEmptyScriptSection() {
    return new RGSSScriptSection("", vscode.TreeItemCollapsibleState.None);
  }

  private parseScriptSectionFromList(): RGSSScriptSection[] {
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
    const scriptSections: RGSSScriptSection[] = [];

    const COLLAPSED = vscode.TreeItemCollapsibleState.None;

    const folderUri = vscode.workspace.workspaceFolders![0].uri;
    const fileUri = folderUri.with({
      path: path.posix.join(folderUri.path, "Scripts"),
    });

    for (const line of lines) {
      if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
        scriptSections.push(this.createEmptyScriptSection());
        continue;
      }

      let targetScriptSection = "";

      if (line.endsWith(".rb")) {
        targetScriptSection = line.replace(".rb", "");
      }

      const scriptSection = new RGSSScriptSection(
        targetScriptSection,
        COLLAPSED
      );
      scriptSection.command = {
        command: "rgss-script-compiler.openScript",
        title: "Open Script",
        arguments: [
          fileUri.with({
            path: path.posix.join(fileUri.path, targetScriptSection + ".rb"),
          }),
        ],
      };
      scriptSections.push(scriptSection);
    }

    return scriptSections;
  }
}
