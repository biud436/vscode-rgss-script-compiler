import { ConfigService } from "../ConfigService";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { LoggingService } from "../LoggingService";
import { MessageHelper } from "./MessageHelper";
import { Path } from "../utils/Path";
import { RGSSScriptSection } from "../providers/RGSSScriptSection";

const IGNORE_BLACK_LIST_REGEXP = /(?:Untitled)\_[\d]+/gi;

export class ScriptListFile {
    private _scriptDirectory = "Scripts";
    private _lines: string[];

    constructor(
        private readonly configService: ConfigService,
        private readonly loggingService: LoggingService,
        private readonly workspaceRoot: string
    ) {
        this._lines = [];
    }

    public get filePath(): string {
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME
        );

        return targetFilePath;
    }

    get lines(): string[] {
        return this._lines;
    }

    /**
     * Check whether the script list file exists.
     *
     * @returns
     */
    public isValid(): boolean {
        if (!fs.existsSync(this.filePath)) {
            vscode.window.showErrorMessage(
                MessageHelper.ERROR.NOT_FOUND_LIST_FILE
            );
            return false;
        }

        return true;
    }

    read(): string[] {
        const targetFilePath = this.filePath;

        const raw = fs.readFileSync(targetFilePath, "utf8");

        const lines = raw.split("\n");

        const scriptList = lines
            .map((line) => line.trim())
            .filter((line) => !line.match(IGNORE_BLACK_LIST_REGEXP));

        this._lines = scriptList;

        return scriptList;
    }

    get lineCount(): number {
        return this._lines.length ?? 0;
    }

    replaceLineByFilename(currentLine: string, newLine: string) {
        const lines = this.lines.slice(0);

        let lineIndex = -1;

        for (const line of lines) {
            lineIndex++;

            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                continue;
            }

            let targetScriptSection = "";

            if (line.endsWith(Path.defaultExt)) {
                targetScriptSection = line.replace(Path.defaultExt, "");
            }

            if (targetScriptSection === currentLine) {
                break;
            }
        }

        const temp = lines[lineIndex];
        if (lines[lineIndex]) {
            lines[lineIndex] = newLine;
        }

        this.loggingService.info(
            `FOUND [${lineIndex}] ${temp} => ${lines[lineIndex]} `
        );

        return lines;
    }

    refresh(tree?: RGSSScriptSection[]) {
        if (!tree) {
            vscode.window.showErrorMessage("tree parameter is not passed.");
            return;
        }
    }
}
