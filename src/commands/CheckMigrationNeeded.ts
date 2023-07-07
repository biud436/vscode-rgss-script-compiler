import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DialogOption } from "../providers/ScriptViewer";
import { ConfigService } from "../services/ConfigService";
import { Path } from "../utils/Path";

/**
 * Check the extension version (0.0.16 -> 0.1.0)
 * @param lines
 * @returns
 */
export function checkMigrationNeeded(lines: string[]): boolean {
    if (lines.length === 0) {
        return false;
    }
    const isLineStartsWithNumber = lines
        .filter((line) => line !== "")
        .every((line) => {
            return line.match(/^[\d]{3}[\.]*[\d]*\-/);
        });

    return !isLineStartsWithNumber;
}

export function showMigrationNeededErrorMessage(): void {
    // vscode.window.showErrorMessage(
    //     "Your info.txt file is too old. Please update your extension."
    // );
    vscode.window.showErrorMessage(
        "You need to migrate to use the new version. Please delete the folder named 'Scripts' and import the script again."
    );
}

function deleteFolder(path: string) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const curPath = `${path}/${file}`;

            if (fs.lstatSync(curPath).isDirectory()) {
                // 재귀적으로 하위 폴더 삭제
                deleteFolder(curPath);
            } else {
                // 파일 삭제
                fs.unlinkSync(curPath);
            }
        });

        // 폴더 삭제
        fs.rmdirSync(path);
    }
}

export async function migrationScriptListFile(
    scriptFolder: string
): Promise<void> {
    const answer = await vscode.window.showInformationMessage(
        "Do you want to migrate?",
        DialogOption.YES,
        DialogOption.NO
    );

    if (answer === DialogOption.NO) {
        return;
    }

    if (!fs.existsSync(scriptFolder)) {
        return;
    }

    deleteFolder(scriptFolder);

    vscode.window.showInformationMessage(
        "Scripts folder has deleted. Please import the script again."
    );

    // await vscode.commands.executeCommand("rgss-script-compiler.unpack");
}
