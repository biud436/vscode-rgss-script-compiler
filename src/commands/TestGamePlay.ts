import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";
import { Path } from "../utils/Path";
import { promisify } from "util";
import { exec } from "child_process";
import * as path from "path";
import { RubyScriptService } from "./ExtractScriptFiles";
import * as cp from "child_process";

const execPromise = promisify(exec);

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
            () => {
                this.loggingService.info("done");
            }
        );
    }

    /**
     * This function is responsible for making the command line options.
     */
    makeCommand() {
        this._args = [];
    }

    /**
     * Executes the ruby script using the ruby interpreter is installed on your system.
     * if the ruby interpreter is not installed, it can't be executed.
     */
    run(): void | this {
        this._process = cp.execFile(
            `Game.exe`,
            this._args,
            {
                encoding: "utf8",
                maxBuffer: 1024 * 1024,
                cwd: Path.resolve(this.configService.getMainGameFolder()),
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

    if (platform !== "win32") {
        showWarnMessage(loggingService);
        return;
    }

    gamePlayService.run()!.onExit((code: number, signal: any) => {
        loggingService.info(`${code} Game.exe file is executed completely.`);
    });
    gamePlayService.pendingTerminate();
}
