import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Path } from "./utils/Path";

namespace RGSS {
    export type config = {
        mainGameFolder?: vscode.Uri;
        workSpace?: vscode.Uri;
        extensionContext?: vscode.ExtensionContext;
    };
}

export class ConfigService {
    private config: RGSS.config;

    constructor() {
        this.config = {};
    }

    public setGameFolder(gameFolder: vscode.Uri) {
        this.config.mainGameFolder = gameFolder;
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
                    mainGameFolder: path.posix.join(
                        this.config.mainGameFolder?.path!
                    ),
                }),
                "utf8"
            )
        );
    }

    public async loadConfig() {
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
            mainGameFolder: vscode.Uri.file(
                JSON.parse(jsonData).mainGameFolder
            ),
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
     * 게임 폴더를 반환합니다.
     *
     */
    public getMainGameFolder(): vscode.Uri {
        return this.config.mainGameFolder!;
    }

    /**
     * VSCode의 작업 공간을 반환합니다.
     *
     * @returns
     */
    public getVSCodeWorkSpace(): vscode.Uri {
        return this.config.workSpace!;
    }

    public getConfig(): RGSS.config {
        return this.config;
    }
}
