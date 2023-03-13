/* eslint-disable @typescript-eslint/naming-convention */
import * as path from "path";
import * as vscode from "vscode";

class PathImpl {
    platform: NodeJS.Platform;

    defaultExt: string = ".rb";

    constructor() {
        this.platform = process.platform;
    }

    /**
     * This method converts with the native path that can use in user's current platform, instead of vscode.Uri.
     *
     * @param url
     * @returns
     */
    resolve(url: vscode.Uri): string {
        switch (this.platform) {
            case "win32":
                return url.fsPath;
            default:
            case "linux":
            case "darwin":
                return path.posix.join(url.path);
        }
    }

    getFileName(filePath: string, ext?: string | undefined) {
        return path.basename(filePath, ext);
    }

    getParentDirectory(filePath: string) {
        return path.dirname(filePath);
    }

    join(...paths: string[]) {
        return path.posix.join(...paths);
    }
}

export const Path = new PathImpl();
