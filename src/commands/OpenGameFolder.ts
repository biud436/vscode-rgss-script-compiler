import * as vscode from "vscode";
import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";
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
function showWarnaMessage(loggingService: LoggingService): void {
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
            default:
                showWarnaMessage(loggingService);
        }
    } catch (e) {
        showWarnaMessage(loggingService);
    }
}
