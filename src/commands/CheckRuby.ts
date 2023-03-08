import { execSync } from "child_process";
import { promisify } from "util";

// const execPromise = promisify(exec);
const COMMAND = "ruby -v";

export function isInstalledRuby(): boolean {
    let isInstalled = false;

    try {
        const stdout = execSync(COMMAND).toString();

        if (stdout.startsWith("ruby")) {
            isInstalled = true;
        } else {
            isInstalled = false;
        }
    } catch (error) {
        isInstalled = false;
    }

    return isInstalled;
}
