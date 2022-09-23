import * as vscode from "vscode";
import { Path } from "./utils/Path";
import { RubyScriptService } from "./commands/ExtractScriptFiles";
import { setGamePath } from "./commands/SetGamePath";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import { Packer } from "./Packer";
import { Unpacker } from "./Unpacker";
import path = require("path");
import { openGameFolder } from "./commands/OpenGameFolder";
import { GamePlayService } from "./commands/TestGamePlay";
import { ScriptExplorerProvider } from "./providers/ScriptViewer";
import { Buttons } from "./buttons.enum";

/**
 * @namespace Helper
 * @description
 * Helper provides commands that can be helpfuled in visual studio code extension.
 */
namespace Helper {
  /**
   * @class Extension
   */
  export class Extension {
    private scriptProvider?: ScriptExplorerProvider;

    constructor(
      private readonly configService: ConfigService,
      private readonly loggingService: LoggingService
    ) {}

    setScriptProvider(scriptProvider: ScriptExplorerProvider) {
      this.scriptProvider = scriptProvider;
    }

    getScriptProvider() {
      return this.scriptProvider;
    }

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

    saveCommand() {
      return vscode.commands.registerCommand(
        "rgss-script-compiler.save",
        async () => {
          this.loggingService.info("save");
          await this.configService.detectRGSSVersion();
          await vscode.commands.executeCommand("workbench.action.files.save");
          await vscode.commands.executeCommand("rgss-script-compiler.compile");
        }
      );
    }

    testPlayCommand() {
      return vscode.commands.registerCommand(
        "rgss-script-compiler.testPlay",
        () => {
          const gamePlayService = new GamePlayService(
            this.configService,
            this.loggingService
          );
          gamePlayService.run();
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

    /**
     * Opens the game folder on Windows or MacOS.
     *
     */
    openGameFolderCommand() {
      return vscode.commands.registerCommand(
        "rgss-script-compiler.openGameFolder",
        () => {
          openGameFolder(this.configService, this.loggingService);
        }
      );
    }

    openScriptFileCommand() {
      return vscode.commands.registerCommand(
        "rgss-script-compiler.openScript",
        (scriptFile: vscode.Uri) => {
          vscode.window.showTextDocument(scriptFile);
        }
      );
    }

    /**
     * Gets command elements.
     * @returns
     */
    getCommands() {
      return [
        this.setGamePathCommand(),
        this.unpackCommand(),
        this.compileCommand(),
        this.openGameFolderCommand(),
        this.testPlayCommand(),
        this.saveCommand(),
        this.openScriptFileCommand(),
      ];
    }
  }

  /**
   * @class StatusBarProviderImpl
   */
  class StatusBarProviderImpl {
    getGameFolderOpenStatusBarItem() {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(file-directory) RGSS: Set Game Folder`;
      statusBarItem.command = "rgss-script-compiler.setGamePath";

      return statusBarItem;
    }

    getUnpackStatusBarItem() {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(sync~spin) RGSS: Import`;
      statusBarItem.command = "rgss-script-compiler.unpack";

      return statusBarItem;
    }

    getCompileStatusBarItem() {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(sync) RGSS: Compile`;
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

    getOpenGameFolderButtonItem() {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = `$(folder) RGSS: Open Game Folder`;
      statusBarItem.command = "rgss-script-compiler.openGameFolder";

      return statusBarItem;
    }
  }

  export const StatusBarProvider = new StatusBarProviderImpl();

  export const createScriptProviderFunction = (
    helper: Helper.Extension,
    configService: ConfigService,
    loggingService: LoggingService
  ) => {
    if (!helper.getScriptProvider()) {
      loggingService.info("Importing the scripts....");

      const scriptViewerPath = Path.resolve(configService.getMainGameFolder());
      const scriptProvider = new ScriptExplorerProvider(
        scriptViewerPath,
        loggingService
      );

      helper.setScriptProvider(scriptProvider);

      vscode.window.registerTreeDataProvider(
        "rgssScriptViewer",
        scriptProvider
      );
    }
  };
}

let statusBarItems = [
  Helper.StatusBarProvider.getGameFolderOpenStatusBarItem(),
  Helper.StatusBarProvider.getUnpackStatusBarItem(),
  Helper.StatusBarProvider.getCompileStatusBarItem(),
  Helper.StatusBarProvider.getOpenGameFolderButtonItem(),
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

/**
 * Check whether the ruby-cli is installed in your system.
 * if not, this extension will not work, so it is will be installed automatically from the ruby server.
 * in case of on Windows, You have to be installed manually, because some useful tools such as 'curl' or 'wget' are not supported on Windows.
 */
function checkDependencies() {
  const platform = process.platform;

  if (!(["linux", "darwin"] as NodeJS.Platform[]).includes(platform)) {
    vscode.window.showErrorMessage(
      "it is not supported on Windows. Please install the Ruby CLI manually."
    );
    return;
  }

  vscode.window
    .showInformationMessage(
      "Ruby didn't install in your system, Do you want to install Ruby?",
      {
        modal: true,
      },
      Buttons.OK
    )
    .then((e) => {
      if (e === Buttons.OK) {
        // install ruby
      } else {
        vscode.window.showErrorMessage(
          "This extension will not work without Ruby."
        );
      }
    });
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
    .then((e) => {
      Helper.createScriptProviderFunction(
        helper,
        configService,
        loggingService
      );
    })
    .catch((e) => {
      statusBarItems.slice(1).forEach((e) => {
        e.hide();
      });
    });

  loggingService.show();

  configService.ON_LOAD_GAME_FOLDER.event(() => {
    Helper.createScriptProviderFunction(helper, configService, loggingService);
  });

  // checkDependencies();

  // Sets Subscriptions.
  context.subscriptions.push(...statusBarItems);
  context.subscriptions.push(...helper.getCommands());
  context.subscriptions.push(
    vscode.commands.registerCommand("rgssScriptViewer.refreshEntry", () =>
      helper.getScriptProvider()?.refresh()
    )
  );
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

/**
 * Shows up statusBarItems when activating the visual studio code extension.
 */
function updateStatusBarItem(): void {
  statusBarItems.forEach((e) => e.show());
}

/**
 * Hide the status bar excluding a one status bar called "Set the Game Folder".
 */
function hideStatusBarItem(): void {
  const bottomStatusBars = statusBarItems.slice(1);
  bottomStatusBars.forEach((e) => e.hide());
}

/**
 * When deactivating the extension, this function calls.
 */
export function deactivate() {
  statusBarItems.forEach((item) => item.hide());
}
