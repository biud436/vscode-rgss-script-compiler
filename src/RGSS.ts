/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";

export namespace RGSS {
    export type VERSION = "RGSS1" | "RGSS2" | "RGSS3";

    export type config = {
        /**
         * Sets or Gets the path of the main game folder.
         */
        mainGameFolder?: vscode.Uri;
        /**
         * Sets or Gets the path of the workspace.
         */
        workSpace?: vscode.Uri;

        /**
         * Sets or Gets the path of the extension folder.
         */
        extensionContext?: vscode.ExtensionContext;

        /**
         * Sets or Gets the RGSS version.
         */
        rgssVersion?: VERSION;
    };

    export type MapOfPath = "RGSS1" | "RGSS2" | "RGSS3";

    export type Path = {
        [key in MapOfPath]: vscode.Uri;
    } & {
        RGSS1: vscode.Uri;
        RGSS2: vscode.Uri;
        RGSS3: vscode.Uri;
    };

    export type JSerializeData = { [key in keyof RGSS.config]: any };
}
