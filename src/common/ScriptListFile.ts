import { ConfigService } from "../ConfigService";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { LoggingService } from "../LoggingService";
import { MessageHelper } from "./MessageHelper";
import { Path } from "../utils/Path";
import { RGSSScriptSection } from "../providers/RGSSScriptSection";
import { generateUUID } from "../utils/uuid";

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

    /**
     * Read lines from the `info.txt` file.
     *
     * Note that this method skips the lines that start with `Untitled_.rb`.
     *
     * @returns
     */
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

    readAll(skip?: boolean): string[] {
        if (skip) {
            return this.read();
        }

        const targetFilePath = this.filePath;
        const raw = fs.readFileSync(targetFilePath, "utf8");
        const lines = raw.split("\n");

        return lines;
    }

    createScriptSectionFromList<T extends RGSSScriptSection>(): T[] {
        const scriptSections: RGSSScriptSection[] = [];
        const COLLAPSED = vscode.TreeItemCollapsibleState.None;
        const folderUri = vscode.workspace.workspaceFolders![0].uri;
        const fileUri = folderUri.with({
            path: path.posix.join(folderUri.path, this._scriptDirectory),
        });
        const lines = this.readAll();
        const { defaultExt } = Path;

        for (const line of lines) {
            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                continue;
            }

            let targetScriptSection = "";

            if (line.endsWith(defaultExt)) {
                targetScriptSection = line.replace(defaultExt, "");
            }

            const scriptFilePath = fileUri
                .with({
                    path: path.posix.join(
                        fileUri.path,
                        targetScriptSection + defaultExt
                    ),
                })
                .toString();

            const scriptSection = new RGSSScriptSection(
                targetScriptSection,
                COLLAPSED,
                scriptFilePath
            );

            scriptSection.id = generateUUID();
            scriptSection.command = {
                command: "vscode.open",
                title: MessageHelper.INFO.OPEN_SCRIPT,
                arguments: [scriptFilePath],
            };
            scriptSections.push(scriptSection);
        }

        return scriptSections as T[];
    }

    get lineCount(): number {
        return this._lines.length ?? 0;
    }

    replaceLineByFilename(currentLine: string, newLine: string) {
        const lines = this.lines.slice(0);
        const { defaultExt: ext } = Path;

        let lineIndex = -1;

        for (const line of lines) {
            lineIndex++;

            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                continue;
            }

            let targetScriptSection = "";

            if (line.endsWith(ext)) {
                targetScriptSection = line.replace(ext, "");
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

    async createBackupFile() {
        const { filePath: targetFilePath } = this;
        const backupFileName = targetFilePath + ".bak";
        if (fs.existsSync(backupFileName)) {
            fs.unlinkSync(backupFileName);
        }

        await fs.promises.copyFile(targetFilePath, backupFileName);
    }

    async refresh(tree?: RGSSScriptSection[]) {
        if (!tree) {
            vscode.window.showErrorMessage("tree parameter is not passed.");
            return;
        }

        const { filePath: targetFilePath } = this;

        const lines = [];

        await this.createBackupFile();

        for (const { filePath } of tree) {
            // 파일명만 추출 (확장자 포함)
            const filename = Path.getFileName(decodeURIComponent(filePath));

            if (filename === Path.defaultExt) {
                continue;
            }

            // ! FIXME 2023.03.13
            // 파일이 존재하지 않을 때 저장 후 Unpack을 강제로 할 경우, 리스트 파일이 갱신되지 않으면서 모든 파일이 날아가게 된다.
            const realFilePath = path.posix.join(
                this.workspaceRoot,
                this._scriptDirectory,
                filename
            );

            // ! FIXME 2023.03.13
            // 모든 파일에 대한 유효성 검증은 필요하지만, continue를 하면 버그 시, 리스트 파일이 비어있게 되므로 continue를 하지 않는다.
            if (!fs.existsSync(realFilePath)) {
                this.loggingService.info(`${filePath} not found. continue.`);
            }

            lines.push(decodeURIComponent(filename));
        }

        const raw = lines.join("\n");

        await fs.promises.writeFile(targetFilePath, raw, "utf8");
    }

    clear() {
        this._lines = [];
    }
}
