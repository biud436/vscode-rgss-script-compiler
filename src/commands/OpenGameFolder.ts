import * as vscode from "vscode";
import { ConfigService } from "../services/ConfigService";
import { LoggingService } from "../services/LoggingService";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Path } from "../utils/Path";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Show up the error message on the bottom of the screen.
 *
 * @param error
 */
function showWarnMessage(loggingService: LoggingService): void {
    const platform = <NodeJS.Platform>process.platform;

    loggingService.info(
        `[Open Game Folder] Sorry, but ${platform} is not supported yet.`
    );
}

/**
 * Opens the game folder without vscode extension API.
 *
 * @param configService
 * @param loggingService
 */
export async function openGameFolder(
    configService: ConfigService,
    loggingService: LoggingService
): Promise<void | never> {
    try {
        const targetFolder = Path.resolve(configService.getMainGameFolder());
        const platform = process.platform;

        switch (platform) {
            case "win32":
                await execPromise(`explorer ${targetFolder}`);
                break;
            case "darwin":
                await execPromise(`open ${targetFolder}`);
                break;
            case "linux": // Linux support (xdg-open built-in)
                await execPromise(`xdg-open ${targetFolder}`);
                break;
        }
    } catch (e) {
        showWarnMessage(loggingService);
    }
}
