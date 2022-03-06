import * as vscode from "vscode";
import * as path from "path";

class PathImpl {
    platform: NodeJS.Platform;

    constructor() {
        this.platform = process.platform;
    }

    resolve(url: vscode.Uri): string {
        switch (this.platform) {
            case "win32":
                return url.fsPath;
            default:
            case "darwin":
                return path.posix.join(url.path);
        }
    }
}

export const Path = new PathImpl();
