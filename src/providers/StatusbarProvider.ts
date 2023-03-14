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

    create(): void {
        this.initializeWithItems();
        this.onDidChangeConfiguration();
    }

    initializeWithItems(): void {
        const { context } = this;

        this._items = ConfigService.getWorkspaceValue(
            "rgssScriptCompiler.showStatusBar"
        )
            ? Helper.getStatusBarItems()
            : [];

        context.subscriptions.push(...this._items);
    }

    initWithGamePath(): void {
        const { context } = this;
        const provider = Helper.StatusBarProvider;

        const config = this.configService.getConfig();

        this._gameFolderPath = provider.getGameFolderPathStatusBarItem(
            config.mainGameFolder!
        );

        context.subscriptions.push(this._gameFolderPath);
    }

    onDidChangeConfiguration(context?: vscode.ExtensionContext): void {
        if (!context) {
            context = this.context;
        }

        const sectionKey = "rgssScriptCompiler.showStatusBar";

        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                const provider = Helper.getStatusBarProvider();

                if (e.affectsConfiguration(sectionKey)) {
                    const config = vscode.workspace
                        .getConfiguration()
                        .get(sectionKey);

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

    dispose(): void {}

    show(): void {
        this._items?.forEach((item) => item.show());
        this._gameFolderPath?.show();
    }

    hide(): void {
        this._items?.forEach((item) => item.hide());
        this._gameFolderPath?.hide();
    }

    showGamePath(): void {
        this._gameFolderPath?.show();
    }

    hideGamePath(): void {
        this._gameFolderPath?.hide();
    }

    isInValid(): boolean {
        if (!this._items) return true;
        return this._items.length === 0;
    }
}
