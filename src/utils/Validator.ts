export namespace Validator {
    export const PLASE_INPUT_SCR_NAME = "Please input a script name.";
    export const REMOVE_SPACE = "Please remove the space.";
    export const REMOVE_SPECIAL_CHARACTER =
        "Please remove the special characters.";
    export const VALID = null;
    export const INVALID_SCRIPT_NAME = "Cannot use this script name.";
    export const AVAILABLE_PLATFORMS = ["win32", "darwin", "linux"];

    export function isStringOrNotEmpty(value: any): boolean {
        return typeof value === "string" && value.length > 0;
    }

    export function isSpace(value: string) {
        return value.match(/[\s]/);
    }

    export function isSpecialCharacter(value: string) {
        return value.match(/[\W]/);
    }

    export function isValidWindowsFilename(filename: string): boolean {
        const illegalCharsRegex = /[<>:"/\\|?*\x00-\x1F]/g;
        const reservedNames = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
        const reservedNamesRegex = /[. ]+$/;
        const maxLength = 260;

        if (filename.length > maxLength) {
            return false;
        }

        if (
            illegalCharsRegex.test(filename) ||
            reservedNames.test(filename) ||
            reservedNamesRegex.test(filename)
        ) {
            return false;
        }

        return true;
    }

    export function isValidMacFilename(filename: string): boolean {
        const illegalCharsRegex = /[:\/]/g;
        const maxLength = 255;

        if (filename.length > maxLength) {
            return false;
        }

        if (illegalCharsRegex.test(filename)) {
            return false;
        }

        return true;
    }

    /**
     * Checks whether the script name is valid or not.
     *
     * @param filename specified script name
     * @returns
     */
    export function isValidScriptName(filename: string): boolean {
        let isValid = true;

        switch (process.platform) {
            case "win32":
                isValid = isValidWindowsFilename(filename);
                break;
            case "darwin":
                isValid = isValidMacFilename(filename);
                break;
            default:
        }

        return isValid;
    }

    export function isPlatformOK(platform: string) {
        return AVAILABLE_PLATFORMS.includes(platform);
    }
}
