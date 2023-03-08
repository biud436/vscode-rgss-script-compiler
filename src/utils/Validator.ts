export namespace Validator {
    export const PLASE_INPUT_SCR_NAME = "Please input a script name.";
    export const REMOVE_SPACE = "Please remove the space.";
    export const REMOVE_SPECIAL_CHARACTER =
        "Please remove the special characters.";
    export const VALID = null;

    export function isStringOrNotEmpty(value: any): boolean {
        return typeof value === "string" && value.length > 0;
    }

    export function isSpace(value: string) {
        return value.match(/[\s]/);
    }

    export function isSpecialCharacter(value: string) {
        return value.match(/[\W]/);
    }
}
