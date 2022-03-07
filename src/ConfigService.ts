import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Path } from "./utils/Path";
import { LoggingService } from "./LoggingService";

namespace RGSS {
  export type VERSION = "RGSS1" | "RGSS2" | "RGSS3";

  export type config = {
    /**
     * Sets or Gets the path of the main game folder.
     */
    mainGameFolder?: vscode.Uri;
    /**
     * Sets or Gets the path of the workspace.
     */
    workSpace?: vscode.Uri;

    /**
     * Sets or Gets the path of the extension folder.
     */
    extensionContext?: vscode.ExtensionContext;

    /**
     * Sets or Gets the RGSS version.
     */
    rgssVersion?: VERSION;
  };

  export type MapOfPath = "RGSS1" | "RGSS2" | "RGSS3";

  export type Path = {
    [key in MapOfPath]: vscode.Uri;
  } & {
    RGSS1: vscode.Uri;
    RGSS2: vscode.Uri;
    RGSS3: vscode.Uri;
  };
}

export class ConfigService {
  private config: RGSS.config;
  public static TARGET_SCRIPT_FILE_NAME = "Scripts.rvdata2";

  constructor() {
    this.config = {};
  }

  public setGameFolder(gameFolder: vscode.Uri) {
    this.config.mainGameFolder = gameFolder;
    this.detectRGSSVersion();
  }

  public async saveConfig() {
    if (!vscode.workspace.workspaceFolders) {
      return vscode.window.showInformationMessage(
        "No folder or workspace opened"
      );
    }

    const folderUri = vscode.workspace.workspaceFolders![0].uri;
    const fileUri = folderUri.with({
      path: path.posix.join(folderUri.path, "rgss-compiler.json"),
    });

    await vscode.workspace.fs.writeFile(
      fileUri,
      Buffer.from(
        JSON.stringify({
          mainGameFolder: path.posix.join(this.config.mainGameFolder?.path!),
        }),
        "utf8"
      )
    );
  }

  public async loadConfig(loggingService?: LoggingService) {
    if (!vscode.workspace.workspaceFolders) {
      return vscode.window.showInformationMessage(
        "No folder or workspace opened"
      );
    }

    const folderUri = vscode.workspace.workspaceFolders![0].uri;
    const fileUri = folderUri.with({
      path: path.posix.join(folderUri.path, "rgss-compiler.json"),
    });
    const readData = await vscode.workspace.fs.readFile(fileUri);
    const jsonData = Buffer.from(readData).toString("utf8");
    this.config = {
      ...this.config,
      mainGameFolder: vscode.Uri.file(JSON.parse(jsonData).mainGameFolder),
    };

    vscode.window.showInformationMessage(jsonData);
  }

  public setVSCodeWorkSpace(workingFolder: vscode.Uri) {
    this.config.workSpace = workingFolder;
  }

  public setExtensionContext(context: vscode.ExtensionContext) {
    this.config.extensionContext = context;
  }

  public getExtensionContext(): vscode.ExtensionContext {
    return this.config.extensionContext!;
  }

  /**
   * Returns the main game folder.
   * Note that this return type is not a string, it is a vscode.Uri type.
   * you should use the path.posix.join() function if you are using the path information in the vscode extension.
   *
   * @returns the main game folder.
   */
  public getMainGameFolder(): vscode.Uri {
    return this.config.mainGameFolder!;
  }

  /**
   * Gets the workspace in user's visual studio code.
   *
   * @returns
   */
  public getVSCodeWorkSpace(): vscode.Uri {
    return this.config.workSpace!;
  }

  public getConfig(): RGSS.config {
    return this.config;
  }

  /**
   * Detects the Ruby Game Scripting System version.
   */
  public detectRGSSVersion() {
    if (this.config.rgssVersion) {
      return this.config.rgssVersion;
    }

    const gameFolderUri = this.getMainGameFolder();
    const version = <RGSS.Path>{
      RGSS1: gameFolderUri.with({
        path: path.posix.join("Data", "Scripts.rxdata"),
      }),
      RGSS2: gameFolderUri.with({
        path: path.posix.join("Data", "Scripts.rvdata"),
      }),
      RGSS3: gameFolderUri.with({
        path: path.posix.join("Data", "Scripts.rvdata2"),
      }),
    };

    Array.from<keyof RGSS.Path>(["RGSS1", "RGSS2", "RGSS3"]).forEach((key) => {
      if (fs.existsSync(Path.resolve(version[key]))) {
        this.config.rgssVersion = key;
      }
    });

    switch (this.config.rgssVersion!) {
      case "RGSS1":
        ConfigService.TARGET_SCRIPT_FILE_NAME = "Scripts.rxdata";
        break;
      case "RGSS2":
        ConfigService.TARGET_SCRIPT_FILE_NAME = "Scripts.rvdata";
        break;
      default:
      case "RGSS3":
        ConfigService.TARGET_SCRIPT_FILE_NAME = "Scripts.rvdata2";
        break;
    }

    return this.config.rgssVersion;
  }
}
