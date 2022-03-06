import * as vscode from "vscode";
import { Path } from "./utils/Path";
import { RubyScriptService } from "./commands/ExtractScriptFiles";
import { setGamePath } from "./commands/SetGamePath";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import { Packer } from "./Packer";
import { Unpacker } from "./Unpacker";

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

export function activate(context: vscode.ExtensionContext) {
    const loggingService = new LoggingService();
    const configService = new ConfigService();

    // 컨텍스트 설정
    configService.setExtensionContext(context);

    configService
        .loadConfig()
        .then((e) => {
            const config = configService.getConfig();
            gameFolderPathWather =
                Helper.StatusBarProvider.getGameFolderPathStatusBarItem(
                    config.mainGameFolder!
                );
            context.subscriptions.push(gameFolderPathWather);
            gameFolderPathWather.show();
        })
        .catch((e) => {
            if (gameFolderPathWather) {
                gameFolderPathWather.hide();
            }
        });

    // 헬퍼 생성
    const helper = new Helper.Extension(configService, loggingService);

    if (!vscode.workspace.workspaceFolders) {
        loggingService.info("작업 폴더가 지정되어 있지 않습니다.");
        throw new Error("작업 폴더가 지정되어 있지 않습니다.");
    }

    context.subscriptions.push(...statusBarItems);

    const workspaces = vscode.workspace.workspaceFolders;
    configService.setVSCodeWorkSpace(workspaces[0].uri);
    configService.loadConfig();

    loggingService.info("RGSS Script Compiler가 실행되었습니다");

    loggingService.show();

    context.subscriptions.push(...helper.getCommands());

    updateStatusBarItem();
}

function updateStatusBarItem(): void {
    statusBarItems.forEach((item) => {
        item.show();
    });
}

export function deactivate() {
    statusBarItems.forEach((item) => {
        item.hide();
    });
}
