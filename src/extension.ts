import * as vscode from "vscode";
import { Path } from "./utils/Path";
import { RubyScriptService } from "./commands/ExtractScriptFiles";
import { setGamePath } from "./commands/SetGamePath";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import { Packer } from "./Packer";
import { Unpacker } from "./Unpacker";
import path = require("path");

/**
 * @namespace Helper
 */
namespace Helper {
  /**
   * @class Extension
   */
  export class Extension {
    constructor(
      private readonly configService: ConfigService,
      private readonly loggingService: LoggingService
    ) {}

    setGamePathCommand() {
      return vscode.commands.registerCommand(
        "rgss-script-compiler.setGamePath",
        async () => {
          await setGamePath(this.configService, this.loggingService);
          this.configService.ON_LOAD_GAME_FOLDER.event((gameFolder) => {
            this.loggingService.info(`Game folder is changed to ${gameFolder}`);
            updateStatusBarItem();
          });
        }
      );
    }

    unpackCommand() {
      return vscode.commands.registerCommand(
        "rgss-script-compiler.unpack",
        () => {
          if (!this.configService) {
            this.loggingService.info("There is no workspace folder.");
            return;
          }

          const unpacker = new Unpacker(
            this.configService,
            this.loggingService
          );
          unpacker.unpack();
        }
      );
    }

    compileCommand() {
      return vscode.commands.registerCommand(
        "rgss-script-compiler.compile",
        () => {
          if (!this.configService) {
            this.loggingService.info("There is no workspace folder.");
            return;
          }

          const bundler = new Packer(this.configService, this.loggingService);
          bundler.pack();
        }
      );
    }

    getCommands() {
      return [
        this.setGamePathCommand(),
        this.unpackCommand(),
        this.compileCommand(),
      ];
    }
  }

  class StatusBarProviderImpl {
    getGameFolderOpenStatusBarItem() {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(file-directory) RGSS3: Set Game Folder`;
      statusBarItem.command = "rgss-script-compiler.setGamePath";

      return statusBarItem;
    }

    getUnpackStatusBarItem() {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(sync~spin) RGSS3: Import`;
      statusBarItem.command = "rgss-script-compiler.unpack";

      return statusBarItem;
    }

    getCompileStatusBarItem() {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(sync) RGSS3: Compile`;
      statusBarItem.command = "rgss-script-compiler.compile";

      return statusBarItem;
    }

    getGameFolderPathStatusBarItem(projectPath: vscode.Uri) {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(pulse) Game Path: ${projectPath.fsPath}`;
      statusBarItem.backgroundColor = "yellow";

      return statusBarItem;
    }
  }

  export const StatusBarProvider = new StatusBarProviderImpl();
}

let statusBarItems = [
  Helper.StatusBarProvider.getGameFolderOpenStatusBarItem(),
  Helper.StatusBarProvider.getUnpackStatusBarItem(),
  Helper.StatusBarProvider.getCompileStatusBarItem(),
];

let gameFolderPathWather: vscode.StatusBarItem | undefined;

function showGamePathWatcher(
  context: vscode.ExtensionContext,
  configService: ConfigService
) {
  const config = configService.getConfig();
  gameFolderPathWather =
    Helper.StatusBarProvider.getGameFolderPathStatusBarItem(
      config.mainGameFolder!
    );
  context.subscriptions.push(gameFolderPathWather);
  gameFolderPathWather.show();
}

export function activate(context: vscode.ExtensionContext) {
  const loggingService = new LoggingService();
  const configService = new ConfigService(loggingService);

  // Set the extension context.
  configService.setExtensionContext(context);

  if (!vscode.workspace.workspaceFolders) {
    loggingService.info("Workspace Folder is not specified.");
    throw new Error("Workspace Folder is not specified.");
  }

  const workspaces = vscode.workspace.workspaceFolders;
  configService.setVSCodeWorkSpace(workspaces[0].uri);

  // Create a helper class.
  const helper = new Helper.Extension(configService, loggingService);

  loggingService.info("RGSS Script Compiler has executed successfully");

  // Load configuration file.
  configService
    .loadConfig(loggingService)
    .then((e) => {
      showGamePathWatcher(context, configService);
    })
    .catch((e) => {
      statusBarItems.slice(1).forEach((e) => {
        e.hide();
      });
    });

  loggingService.show();

  // Sets Subscriptions.
  context.subscriptions.push(...statusBarItems);
  context.subscriptions.push(...helper.getCommands());
  context.subscriptions.push(
    vscode.workspace.onDidDeleteFiles((e) => {
      e.files.forEach((e) => {
        if (path.posix.join(e.path).includes("rgss-compiler.json")) {
          loggingService.info("rgss-compiler.json is deleted.");

          hideStatusBarItem();
        }
      });
    })
  );

  updateStatusBarItem();
}

function updateStatusBarItem(): void {
  statusBarItems.forEach((e) => {
    e.show();
  });
}

function hideStatusBarItem(): void {
  statusBarItems.slice(1).forEach((e) => {
    e.hide();
  });
}

export function deactivate() {
  statusBarItems.forEach((item) => {
    item.hide();
  });
}
