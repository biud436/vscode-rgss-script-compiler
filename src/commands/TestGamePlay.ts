import { ConfigService } from "../services/ConfigService";
import { LoggingService } from "../services/LoggingService";
import { Path } from "../utils/Path";
import { promisify } from "util";
import { exec } from "child_process";
import * as path from "path";
import { RubyScriptService } from "./ExtractScriptFiles";
import * as cp from "child_process";
import { WorkspaceValue } from "../common/WorkspaceValue";
import { isInstalledWine } from "./CheckWine";

const execPromise = promisify(exec);

export interface GamePlayServiceOptions {
    gamePath: string;
    cwd: string;
    args: string[];
}

export const AVAILABLE_PLATFORMS = ["win32", "darwin", "linux"];

/**
 * Show up the error message on the bottom of the screen.
 *
 * @param error
 */
function showWarnMessage(loggingService: LoggingService): void {
    const platform = <NodeJS.Platform>process.platform;

    loggingService.info(`${platform} is not supported yet.`);
}

export class GamePlayService extends RubyScriptService {
    constructor(
        protected readonly configService: ConfigService,
        protected readonly loggingService: LoggingService
    ) {
        super(
            configService,
            loggingService,
            {
                scriptFile: "",
                vscodeWorkspaceFolder: "",
            },
            (err: any) => {
                if (err) {
                    this.loggingService.info(err);
                }
                this.loggingService.info("done");
            }
        );
    }

    /**
     * This function is responsible for making the command line options.
     */
    makeCommand() {
        const version = this.configService.getRGSSVersion();
        const platform = process.platform;

        if (platform === "darwin") {
            this._args = [];
            return;
        }

        this._args = version === "RGSS3" ? ["console", "test"] : [];
    }

    /**
     * Executes the ruby script using the ruby interpreter is installed on your system.
     * if the ruby interpreter is not installed, it can't be executed.
     */
    run(): void | this {
        const platform = <NodeJS.Platform>process.platform;
        let target = <GamePlayServiceOptions>{
            gamePath: "",
            cwd: "",
            args: [],
        };

        switch (platform) {
            case "win32":
                target.gamePath = "Game.exe";
                target.args = this._args!;
                target.cwd = Path.resolve(
                    this.configService.getMainGameFolder()
                );
                break;
            case "darwin": // MKXP-Z supported
                target.gamePath = "open";
                target.args = [
                    "-b",
                    ConfigService.getWorkspaceValue(
                        WorkspaceValue.macOsBundleIdentifier
                    )!,
                    Path.join(
                        ConfigService.getWorkspaceValue(
                            WorkspaceValue.macOsGamePath
                        )!,
                        ".."
                    ),
                ];
                target.cwd = "";
                break;
            case "linux": // Linux supported with Wine
                this.loggingService.info("Checking for Wine...");
                if (!isInstalledWine()) {
                    this.loggingService.info(
                        "Cannot execute test play on Linux without Wine!"
                    );
                    this.loggingService.info(
                        "Install Wine on your system and try again"
                    );
                    return;
                }
                this.loggingService.info("Wine is installed!");
                target.gamePath = "wine";
                // EXE for wine plus opt. args, ("." included incase it is not in $PATH)
                target.args = ["./Game.exe"].concat(this._args!);
                // Resolve POSIX path
                target.cwd = Path.resolve(
                    this.configService.getMainGameFolder()
                );
                break;
        }

        this._process = cp.execFile(
            target.gamePath,
            target.args,
            {
                encoding: "utf8",
                maxBuffer: 1024 * 1024,
                cwd: target.cwd,
                shell: true,
            },
            this._callback
        );
        if (!this._process) {
            return;
        }
        this._process.stdout!.on("data", (data: any) => {
            this.loggingService.info(data);
        });
        this._process.stdout!.on("end", (data: any) => {
            this.loggingService.info(data);
        });
        this._process.stdin!.end();
        return this;
    }
}

/**
 * This function is responsible for creating all script files as one script bundle file after running the Ruby interpreter.
 *
 * @param loggingService
 * @param rubyScriptService
 */
export function handleTestPlay<T extends GamePlayService = GamePlayService>(
    loggingService: LoggingService,
    gamePlayService: T
): void {
    const platform = process.platform;

    if (!AVAILABLE_PLATFORMS.includes(platform)) {
        showWarnMessage(loggingService);
        return;
    }

    gamePlayService.run()!.onExit((code: number, signal: any) => {
        loggingService.info(`${code} Game.exe file is executed completely.`);
    });
    gamePlayService.pendingTerminate();
}
