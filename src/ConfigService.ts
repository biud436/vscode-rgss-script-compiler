import * as vscode from "vscode";

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
