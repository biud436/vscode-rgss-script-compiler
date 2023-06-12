import { execSync } from "child_process";

const COMMAND = "wine --version";

/**
 * Checks for Wine availability specific for Linux systems
 * @returns boolean
 */
export function isInstalledWine(): boolean {
    let isInstalled = false;

    try {
        const stdout = execSync(COMMAND).toString() ?? "";
        isInstalled = stdout.startsWith("wine") ? true : false;
    } catch (error: any) {
        isInstalled = false;
    }

    return isInstalled;
}
