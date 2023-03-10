/* eslint-disable curly */
import * as vscode from "vscode";
import { ConfigService } from "../ConfigService";
import { Helper } from "../Helper";
import { LoggingService } from "../LoggingService";

interface IStatusbarProvider {
    show(): void;
    hide(): void;
}

export class StatusbarProvider
    implements IStatusbarProvider, vscode.Disposable
{
    private _items?: vscode.StatusBarItem[];
    private _gameFolderPath?: vscode.StatusBarItem | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {}

    initializeWithItems() {
        const { context } = this;

        // Create the status bar items.
        this._items = ConfigService.getWorkspaceValue(
            "rgssScriptCompiler.showStatusBar"
        )
            ? Helper.getStatusBarItems()
            : [];

        context.subscriptions.push(...this._items);
    }

    initWithGamePath() {
        const { context } = this;
        const provider = Helper.StatusBarProvider;

        const config = this.configService.getConfig();

        // Create the game path text
        this._gameFolderPath = provider.getGameFolderPathStatusBarItem(
            config.mainGameFolder!
        );

        context.subscriptions.push(this._gameFolderPath);
    }

    onDidChangeConfiguration(context?: vscode.ExtensionContext) {
        if (!context) {
            context = this.context;
        }

        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                const provider = Helper.getStatusBarProvider();

                if (
                    e.affectsConfiguration("rgssScriptCompiler.showStatusBar")
                ) {
                    const config = vscode.workspace
                        .getConfiguration()
                        .get("rgssScriptCompiler.showStatusBar");

                    this.loggingService.info(
                        `Status bar items visibility changed to: ${config}`
                    );

                    if (config) {
                        if (this.isInValid()) {
                            this._items = [
                                provider.getGameFolderOpenStatusBarItem(),
                                provider.getUnpackStatusBarItem(),
                                provider.getCompileStatusBarItem(),
                                provider.getOpenGameFolderButtonItem(),
                            ];
                        }
                        this.show();
                    } else {
                        this.hide();
                    }
                }
            })
        );
    }

    dispose() {}

    show() {
        this._items?.forEach((item) => item.show());
        this._gameFolderPath?.show();
    }

    hide() {
        this._items?.forEach((item) => item.hide());
        this._gameFolderPath?.hide();
    }

    showGamePath() {
        this._gameFolderPath?.show();
    }

    hideGamePath() {
        this._gameFolderPath?.hide();
    }

    isInValid() {
        if (!this._items) return true;
        return this._items.length === 0;
    }
}
