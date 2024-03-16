import * as vscode from "vscode";
import { ConfigService } from "../services/ConfigService";

/**
 * This function is responsible for setting the main game folder to config file.
 *
 * @param configService
 * @param loggingService
 */
export async function setGamePath(configService: ConfigService) {
    const value = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Set Game Folder",
    });

    if (value) {
        await configService.setGameFolder(value[0]);
        await configService.saveConfig();

        // emits on load game folder event.
        configService.ON_LOAD_GAME_FOLDER.fire(value[0].fsPath);
    }
}
