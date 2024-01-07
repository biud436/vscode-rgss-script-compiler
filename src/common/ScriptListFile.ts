/* eslint-disable @typescript-eslint/naming-convention */
import { ConfigService } from "../services/ConfigService";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { LoggingService } from "../services/LoggingService";
import { MessageHelper } from "./MessageHelper";
import { Path } from "../utils/Path";
import { RGSSScriptSection } from "../providers/RGSSScriptSection";
import { generateUUID } from "../utils/uuid";

const IGNORE_BLACK_LIST_REGEXP = /(?:Untitled)\_[\d]+/gi;

export class ScriptListFile {
    private _scriptDirectory = "Scripts";
    private static _TMP = ".bak";
    private _lines: string[];

    constructor(
        private readonly configService: ConfigService,
        private readonly loggingService: LoggingService,
        private readonly workspaceRoot: string,
    ) {
        this._lines = [];
    }

    public get filePath(): string {
        const targetFilePath = path.posix.join(
            this.workspaceRoot,
            this._scriptDirectory,
            ConfigService.TARGET_SCRIPT_LIST_FILE_NAME,
        );

        return targetFilePath;
    }

    get lines(): string[] {
        return this._lines;
    }

    get lineCount(): number {
        return this._lines.length ?? 0;
    }

    /**
     * Check whether the script list file exists.
     *
     * @returns
     */
    public isValid(): boolean {
        this.loggingService.info(`ScriptListFile: ${this.filePath}`);
        if (!fs.existsSync(this.filePath)) {
            vscode.window.showErrorMessage(
                MessageHelper.ERROR.NOT_FOUND_LIST_FILE,
            );
            return false;
        }

        return true;
    }

    /**
     * 텍스트 파일을 읽어서 각 라인을 배열로 반환합니다.
     * `Untitled_*.rb`로 시작하는 라인은 포함되지 않습니다.
     *
     * Read lines from the `info.txt` file.
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

    /**
     * 텍스트 파일을 읽어서 각 라인을 배열로 반환합니다.
     *
     * @param skip
     * @returns
     */
    readAll(skip?: boolean): string[] {
        if (skip) {
            return this.read();
        }

        const targetFilePath = this.filePath;
        const raw = fs.readFileSync(targetFilePath, "utf8");
        const lines = raw.split("\n");

        return lines;
    }

    /**
     * 리스트 파일을 라인 별로 읽고 새로운 트리를 생성합니다.
     * `Untitled_*.rb`로 시작하는 라인은 포함되지 않습니다.
     */
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
            let isBlankName = false;
            let isEmptyContent = false;

            // 빈 라인이거나, 무시할 라인이면 다음 라인으로 넘어갑니다.
            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                isBlankName = true;
            }

            let targetScriptSection = "";

            // 확장자가 .rb로 끝나는 라인을 찾습니다.
            if (line.endsWith(defaultExt)) {
                targetScriptSection = line.replace(defaultExt, "");
            }

            const targetFilePath = Path.join(
                fileUri.path,
                targetScriptSection + defaultExt,
            );

            const scriptFilePath = fileUri
                .with({
                    path: targetFilePath,
                })
                .toString();

            const stat = fs.statSync(
                fileUri.with({
                    path: targetFilePath,
                }).fsPath,
            );
            // 빈 파일인지 체크하는 플래그입니다.
            if (stat.size === 0) {
                isEmptyContent = true;
            }

            const scriptSection = new RGSSScriptSection(
                isEmptyContent ? "" : targetScriptSection,
                COLLAPSED,
                scriptFilePath,
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

    updateFilename(
        scriptFileName: string,
        newScriptFileName: string,
    ): string[] {
        const lines = this.lines.slice(0);
        const { defaultExt: ext } = Path;

        let lineIndex = -1;

        for (const line of lines) {
            lineIndex++;

            // 빈 라인이거나, 무시할 라인이면 다음 라인으로 넘어갑니다.
            if (line.match(IGNORE_BLACK_LIST_REGEXP)) {
                continue;
            }

            let targetScriptSection = "";

            // 확장자가 .rb로 끝나는 라인을 찾습니다.
            if (line.endsWith(ext)) {
                targetScriptSection = line.replace(ext, "");
            }

            // 스크립트 파일명이 같으면 라인 인덱스를 반환합니다.
            if (targetScriptSection === scriptFileName) {
                break;
            }
        }

        // 라인 인덱스가 유효하면 해당 라인을 새로운 스크립트 파일명으로 변경합니다.
        const temp = lines[lineIndex];
        if (lines[lineIndex]) {
            lines[lineIndex] = newScriptFileName;
        }

        // 변경된 라인을 로그로 출력합니다.
        this.loggingService.info(
            `FOUND [${lineIndex}] ${temp} => ${lines[lineIndex]} `,
        );

        return lines;
    }

    /**
     * 백업 파일을 생성합니다.
     */
    async createBackupFile(): Promise<void> {
        const { filePath: targetFilePath } = this;
        const backupFileName = targetFilePath + ScriptListFile._TMP;
        if (fs.existsSync(backupFileName)) {
            fs.unlinkSync(backupFileName);
        }

        await fs.promises.copyFile(targetFilePath, backupFileName);
    }

    async refresh<T extends RGSSScriptSection>(tree?: T[]): Promise<void> {
        if (!tree) {
            vscode.window.showErrorMessage("tree parameter is not passed.");
            return;
        }

        const { filePath: targetFilePath } = this;
        const { getFileName, defaultExt } = Path;

        const lines = [];

        await this.createBackupFile();

        for (const { filePath } of tree) {
            // 파일명만 추출 (확장자 포함)
            const filename = getFileName(decodeURIComponent(filePath));

            if (filename === defaultExt) {
                continue;
            }

            // ! FIXME 2023.03.13
            // 파일이 존재하지 않을 때 저장 후 Unpack을 강제로 할 경우, 리스트 파일이 갱신되지 않으면서 모든 파일이 날아가게 된다.
            const realFilePath = path.posix.join(
                this.workspaceRoot,
                this._scriptDirectory,
                filename,
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

    clear(): void {
        this._lines = [];
    }
}
