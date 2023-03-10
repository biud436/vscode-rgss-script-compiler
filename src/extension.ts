import * as vscode from "vscode";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import * as path from "path";
import { RGSSScriptSection } from "./providers/RGSSScriptSection";
import { isInstalledRuby } from "./commands/CheckRuby";
import { Helper } from "./Helper";
import { StatusbarProvider } from "./providers/StatusbarProvider";

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

    // ! Step 3: Ruby Check
    loggingService.info(`Ruby installed: ${isInstalledRuby()}`);

    // ! Step 4: Set the workspace folder.
    // Set the extension context.
    configService.setExtensionContext(context);

    if (!vscode.workspace.workspaceFolders) {
        loggingService.info("Workspace Folder is not specified.");
        throw new Error("Workspace Folder is not specified.");
    }

    const workspaces = vscode.workspace.workspaceFolders;
    configService.setVSCodeWorkSpace(workspaces[0].uri);

    statusbarProvider = new StatusbarProvider(
        context,
        loggingService,
        configService
    );

    // ! Step 5 : Create a helper class and set the status bar provider.
    const helper = new Helper.Extension(
        configService,
        loggingService,
        statusbarProvider
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
                loggingService
            );
        })
        .catch((e) => {
            statusbarProvider.hide();
        });

    loggingService.show();

    configService.ON_LOAD_GAME_FOLDER.event(() => {
        Helper.createScriptProviderFunction(
            helper,
            configService,
            loggingService
        );
        statusbarProvider.show();
    });

    // Sets Subscriptions.
    context.subscriptions.push(...helper.getCommands());
    context.subscriptions.push(
        ...[
            vscode.commands.registerCommand(
                "rgssScriptViewer.refreshEntry",
                () => helper.getScriptProvider()?.refresh()
            ),
            vscode.commands.registerCommand(
                "rgss-script-compiler.deleteFile",
                (item: RGSSScriptSection) => {
                    helper.getScriptProvider()?.deleteTreeItem(item);
                }
            ),
            vscode.commands.registerCommand(
                "rgss-script-compiler.newFile",
                (item: RGSSScriptSection) => {
                    helper.getScriptProvider()?.addTreeItem(item);
                }
            ),
            vscode.commands.registerCommand(
                "rgss-script-compiler.refreshScriptExplorer",
                () => {
                    helper.getScriptProvider()?.refreshExplorer();
                }
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
        ]
    );
}

/**
 * When deactivating the extension, this function calls.
 */
export function deactivate() {
    statusbarProvider.hide();
}
