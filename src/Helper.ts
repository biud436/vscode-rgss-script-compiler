/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { Path } from "./utils/Path";
import { setGamePath } from "./commands/SetGamePath";
import { ConfigService } from "./services/ConfigService";
import { LoggingService } from "./services/LoggingService";
import { Packer } from "./Packer";
import { Unpacker } from "./Unpacker";
import { openGameFolder } from "./commands/OpenGameFolder";
import { GamePlayService } from "./commands/TestGamePlay";
import { ScriptExplorerProvider } from "./providers/ScriptViewer";
import { StatusbarProvider } from "./providers/StatusbarProvider";

/**
 * @namespace Helper
 * @description
 * Helper provides commands that can be helpfuled in visual studio code extension.
 */
export namespace Helper {
    /**
     * @class Extension
     */
    export class Extension {
        private scriptProvider?: ScriptExplorerProvider;

        constructor(
            private readonly configService: ConfigService,
            private readonly loggingService: LoggingService,
            private readonly statusbarProvider: StatusbarProvider,
        ) {
            this.updateConfiguration();
        }

        setScriptProvider(scriptProvider: ScriptExplorerProvider) {
            this.scriptProvider = scriptProvider;
        }

        getScriptProvider() {
            return this.scriptProvider;
        }

        async updateConfiguration() {
            const config =
                vscode.workspace.getConfiguration("rgssScriptCompiler");

            if (!config.has("showStatusBar")) {
                await config.update("showStatusBar", false);
            }
        }

        setGamePathCommand() {
            return vscode.commands.registerCommand(
                "rgss-script-compiler.setGamePath",
                async () => {
                    await setGamePath(this.configService, this.loggingService);
                    this.configService.ON_LOAD_GAME_FOLDER.event(
                        (gameFolder) => {
                            this.loggingService.info(
                                `Game folder is changed to ${gameFolder}`,
                            );
                            this.statusbarProvider.show();
                        },
                    );
                },
            );
        }

        saveCommand() {
            return vscode.commands.registerCommand(
                "rgss-script-compiler.save",
                async () => {
                    await this.configService.detectRGSSVersion();
                    await vscode.commands.executeCommand(
                        "workbench.action.files.save",
                    );
                    await vscode.commands.executeCommand(
                        "rgss-script-compiler.compile",
                    );
                },
            );
        }

        testPlayCommand() {
            return vscode.commands.registerCommand(
                "rgss-script-compiler.testPlay",
                () => {
                    const gamePlayService = new GamePlayService(
                        this.configService,
                        this.loggingService,
                    );
                    gamePlayService.run();
                },
            );
        }

        unpackCommand() {
            return vscode.commands.registerCommand(
                "rgss-script-compiler.unpack",
                () => {
                    if (!this.configService) {
                        this.loggingService.info(
                            "There is no workspace folder.",
                        );
                        return;
                    }

                    const unpacker = new Unpacker(
                        this.configService,
                        this.loggingService,
                        () => {
                            vscode.commands
                                .executeCommand(
                                    "rgss-script-compiler.refreshScriptExplorer",
                                )
                                .then(() => {
                                    this.loggingService.info("refreshed");
                                });
                        },
                    );
                    unpacker.unpack();
                },
            );
        }

        compileCommand() {
            return vscode.commands.registerCommand(
                "rgss-script-compiler.compile",
                () => {
                    if (!this.configService) {
                        this.loggingService.info(
                            "There is no workspace folder.",
                        );
                        return;
                    }

                    const bundler = new Packer(
                        this.configService,
                        this.loggingService,
                    );
                    bundler.pack();
                },
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
                },
            );
        }

        openScriptFileCommand() {
            return vscode.commands.registerCommand(
                "rgss-script-compiler.openScript",
                (scriptFile: vscode.Uri) => {
                    vscode.window.showTextDocument(scriptFile);
                },
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
                vscode.StatusBarAlignment.Left,
            );
            statusBarItem.text = `$(file-directory) RGSS: Set Game Folder`;
            statusBarItem.command = "rgss-script-compiler.setGamePath";

            return statusBarItem;
        }

        getUnpackStatusBarItem() {
            const statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left,
            );
            statusBarItem.text = `$(sync~spin) RGSS: Import`;
            statusBarItem.command = "rgss-script-compiler.unpack";

            return statusBarItem;
        }

        getCompileStatusBarItem() {
            const statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left,
            );
            statusBarItem.text = `$(sync) RGSS: Compile`;
            statusBarItem.command = "rgss-script-compiler.compile";

            return statusBarItem;
        }

        getGameFolderPathStatusBarItem(projectPath: vscode.Uri) {
            const statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left,
            );
            statusBarItem.text = `$(pulse) Game Path: ${projectPath.fsPath}`;
            statusBarItem.backgroundColor = "yellow";

            return statusBarItem;
        }

        getOpenGameFolderButtonItem() {
            const statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left,
            );
            statusBarItem.text = `$(folder) RGSS: Open Game Folder`;
            statusBarItem.command = "rgss-script-compiler.openGameFolder";

            return statusBarItem;
        }
    }

    export const StatusBarProvider = new StatusBarProviderImpl();

    export const getStatusBarProvider = () => {
        return StatusBarProvider;
    };

    export const getStatusBarItems = () => {
        return [
            Helper.StatusBarProvider.getGameFolderOpenStatusBarItem(),
            Helper.StatusBarProvider.getUnpackStatusBarItem(),
            Helper.StatusBarProvider.getCompileStatusBarItem(),
            Helper.StatusBarProvider.getOpenGameFolderButtonItem(),
        ];
    };

    export const createScriptProviderFunction = (
        helper: Helper.Extension,
        configService: ConfigService,
        loggingService: LoggingService,
    ) => {
        if (!helper.getScriptProvider()) {
            loggingService.info("Importing the scripts....");

            const scriptViewerPath = Path.resolve(
                configService.getMainGameFolder(),
            );
            const scriptProvider = new ScriptExplorerProvider(
                scriptViewerPath,
                loggingService,
                configService,
            );

            helper.setScriptProvider(scriptProvider);

            const context = configService.getExtensionContext();

            const view = vscode.window.createTreeView("rgssScriptViewer", {
                treeDataProvider: scriptProvider,
                showCollapseAll: true,
                canSelectMany: true,
                dragAndDropController: scriptProvider,
            });
            context.subscriptions.push(view);
        }
    };
}
