import * as vscode from "vscode";
import { ConfigService } from "./services/ConfigService";
import { LoggingService } from "./services/LoggingService";
import * as path from "path";
import { RGSSScriptSection } from "./providers/RGSSScriptSection";
import { isInstalledRuby } from "./commands/CheckRuby";
import { Helper } from "./Helper";
import { StatusbarProvider } from "./providers/StatusbarProvider";
import { store } from "./store/GlobalStore";

let statusbarProvider: StatusbarProvider;

/**
 * Entry point of the extension.
 *
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
    // ! Step 1: Logging Service
    const loggingService = new LoggingService();

    // ! Step 2: Config Service
    const configService = new ConfigService(loggingService);
    configService.setExtensionContext(context);

    // ! Step 3: Ruby Check
    const isRubyOK = isInstalledRuby();
    loggingService.info(`Ruby installed: ${isRubyOK}`);
    if (!isRubyOK) {
        vscode.window.showErrorMessage(
            "Can't find Ruby. Please install Ruby and try again.",
        );
    }

    store.setIsRubyInstalled(isRubyOK);

    // ! Step 4: Set the workspace folder.

    if (!vscode.workspace.workspaceFolders) {
        loggingService.info("Workspace Folder is not specified.");
        throw new Error("Workspace Folder is not specified.");
    }

    const workspaces = vscode.workspace.workspaceFolders;
    configService.setVSCodeWorkSpace(workspaces[0].uri);

    statusbarProvider = new StatusbarProvider(
        context,
        loggingService,
        configService,
    );

    // ! Step 5 : Create a helper class and set the status bar provider.
    const helper = new Helper.Extension(
        configService,
        loggingService,
        statusbarProvider,
    );

    loggingService.info("RGSS Script Compiler has executed successfully");

    statusbarProvider.create();

    // Load configuration file.
    configService
        .loadConfig(loggingService)
        .then((e) => {
            statusbarProvider.initWithGamePath();
        })
        .then((e) => {
            Helper.createScriptProviderFunction(
                helper,
                configService,
                loggingService,
            );
            loggingService.info("configService.loadConfig(loggingService)");
        })
        .catch((e) => {
            console.warn(e);
            statusbarProvider.hide();
        });

    loggingService.show();

    configService.ON_LOAD_GAME_FOLDER.event(() => {
        Helper.createScriptProviderFunction(
            helper,
            configService,
            loggingService,
        );
        statusbarProvider.show();
        loggingService.info("configService.ON_LOAD_GAME_FOLDER.event()");
    });

    // Sets Subscriptions.
    context.subscriptions.push(...helper.getCommands());
    context.subscriptions.push(
        ...[
            vscode.commands.registerCommand(
                "rgssScriptViewer.refreshEntry",
                () => helper.getScriptProvider()?.refresh(),
            ),
            vscode.commands.registerCommand(
                "rgss-script-compiler.deleteFile",
                (item: RGSSScriptSection) => {
                    helper.getScriptProvider()?.deleteTreeItem(item);
                },
            ),
            vscode.commands.registerCommand(
                "rgss-script-compiler.renameFile",
                (item: RGSSScriptSection) => {
                    helper.getScriptProvider()?.changeScriptNameManually(item);
                },
            ),
            vscode.commands.registerCommand(
                "rgss-script-compiler.newFile",
                (item: RGSSScriptSection) => {
                    helper.getScriptProvider()?.addTreeItem(item);
                },
            ),
            vscode.commands.registerCommand(
                "rgss-script-compiler.refreshScriptExplorer",
                () => {
                    loggingService.info("[3]");
                    helper.getScriptProvider()?.refreshExplorer();
                },
            ),
            vscode.workspace.onDidDeleteFiles((e) => {
                e.files.forEach((e) => {
                    if (
                        path.posix.join(e.path).includes("rgss-compiler.json")
                    ) {
                        loggingService.info("rgss-compiler.json is deleted.");

                        statusbarProvider.hide();
                    }
                });
            }),
        ],
    );
    context.subscriptions.push(
        ...[
            vscode.commands.registerCommand(
                "rgss-script-compiler.importAuto",
                () => {
                    vscode.commands
                        .executeCommand("rgss-script-compiler.setGamePath")
                        .then((_) => {
                            return vscode.commands.executeCommand(
                                "rgss-script-compiler.unpack",
                                () => {},
                            );
                        });
                },
            ),
        ],
    );
}

/**
 * When deactivating the extension, this function calls.
 */
export function deactivate() {
    statusbarProvider.hide();
}
