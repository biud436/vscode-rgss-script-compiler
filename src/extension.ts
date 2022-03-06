import * as vscode from "vscode";
import { Path } from "./utils/Path";
import { RubyScriptService } from "./commands/ExtractScriptFiles";
import { setGamePath } from "./commands/SetGamePath";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import { Packer } from "./Packer";
import { Unpacker } from "./Unpacker";
import path = require("path");

namespace Helper {
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
                    updateStatusBarItem();
                }
            );
        }

        unpackCommand() {
            return vscode.commands.registerCommand(
                "rgss-script-compiler.unpack",
                () => {
                    if (!this.configService) {
                        this.loggingService.info("작업 폴더가 없습니다.");
                        return;
                    }

                    this.loggingService.info(
                        `작업 폴더는 ${Path.resolve(
                            this.configService.getMainGameFolder()
                        )} 입니다.`
                    );

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
                        this.loggingService.info("작업 폴더가 없습니다.");
                        return;
                    }

                    this.loggingService.info(
                        `작업 폴더는 ${Path.resolve(
                            this.configService.getMainGameFolder()
                        )} 입니다.`
                    );

                    const bundler = new Packer(
                        this.configService,
                        this.loggingService
                    );
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
            statusBarItem.text = `$(file-directory) RGSS3: Game Folder Open`;
            statusBarItem.command = "rgss-script-compiler.setGamePath";

            return statusBarItem;
        }

        getUnpackStatusBarItem() {
            const statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left
            );
            statusBarItem.text = `$(sync~spin) RGSS3: Unpack`;
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
    const configService = new ConfigService();

    // 컨텍스트 설정
    configService.setExtensionContext(context);

    if (!vscode.workspace.workspaceFolders) {
        loggingService.info("작업 폴더가 지정되어 있지 않습니다.");
        throw new Error("작업 폴더가 지정되어 있지 않습니다.");
    }

    const workspaces = vscode.workspace.workspaceFolders;
    configService.setVSCodeWorkSpace(workspaces[0].uri);

    // 헬퍼 생성
    const helper = new Helper.Extension(configService, loggingService);

    loggingService.info("RGSS Script Compiler가 실행되었습니다");

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

    context.subscriptions.push(...statusBarItems);
    context.subscriptions.push(...helper.getCommands());
    context.subscriptions.push(
        vscode.workspace.onDidDeleteFiles((e) => {
            e.files.forEach((e) => {
                if (path.posix.join(e.path).includes("rgss-compiler.json")) {
                    loggingService.info("설정파일이 삭제되었습니다.");

                    statusBarItems.slice(1).forEach((e) => {
                        e.hide();
                    });
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

export function deactivate() {
    statusBarItems.forEach((item) => {
        item.hide();
    });
}
