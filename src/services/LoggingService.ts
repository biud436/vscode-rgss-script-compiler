/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as chalk from "chalk";
import * as dayjs from "dayjs";

const LogLevel = {
    info: "[INFO]",
    warn: "[WARN]",
    error: "[ERROR]",
};

export class LoggingService {
    private outputChannel: vscode.OutputChannel =
        vscode.window.createOutputChannel("rgss-script-compiler");

    public show() {
        this.outputChannel.show();
    }

    public clear() {
        this.outputChannel.clear();
    }

    /**
     * 커링(Currying) 기법을 사용하여 로그를 출력합니다.
     * @param color
     * @returns
     */
    private createLog =
        (color: chalk.Chalk) =>
        (level: string) =>
        (...message: string[]) => {
            const time = dayjs().format("YYYY-MM-DD HH:mm:ss");

            this.outputChannel.appendLine(
                color`${level} ${time} ::>> ${message.join(" ")}`,
            );
        };

    public info = this.createLog(chalk.white)(LogLevel.info);
    public warn = this.createLog(chalk.yellow)(LogLevel.warn);
    public error = this.createLog(chalk.red)(LogLevel.error);
}
