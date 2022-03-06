import * as vscode from "vscode";
import * as chalk from "chalk";

export class LoggingService {
    private outputChannel: vscode.OutputChannel =
        vscode.window.createOutputChannel("rgss-script-runner");

    public show() {
        this.outputChannel.show();
    }

    public info(message: string): void {
        this.outputChannel.appendLine(chalk.yellow(message));
    }
}
