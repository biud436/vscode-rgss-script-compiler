import { ConfigService } from "../ConfigService";
import * as cp from "child_process";
import * as path from "path";
import { LoggingService } from "../LoggingService";
import { chdir } from "process";

export type RubyRunnerCommandOptions = {
    /**
     * Gets or Sets the path of workspace folder
     */
    vscodeWorkspaceFolder: string;

    /**
     * Gets or Sets the path of the script file in game folder.
     * the filename is the same as 'Scripts.rvdata2' in case of RPG Maker VX Ace.
     */
    scriptFile: string;
};

/**
 * This callback function represents for running the Ruby script.
 */
export type RubyProcessCallback = (
    /**
     * in case of Javascript or Typescript, the error object returns as any type regardless of the error type.
     */
    error: cp.ExecFileException | null,
    /**
     * This is the standard output of the Ruby script.
     */
    stdout: string,
    /**
     * This is the standard error of the Ruby script.
     */
    stderr: string
) => void;

/**
 * after this callback function is executed, the ruby interpreter process will be terminated on your terminal.
 */
export type RubyProcessOnExitCallback = (code: number, signal: any) => void;

/**
 * This class is responsible for extracting ruby script files after running the Ruby script.
 * DI(Dependency Injection) is used for this function.
 * so you have to inject the logging service and ruby script service from the outside of this function.
 */
export type ExtractScriptFileFunction = (
    loggingService: LoggingService,
    rubyScriptService: RubyScriptService
) => void;

/**
 * @class RubyScriptService
 * @description
 * This class is responsible to make the ruby script files after extracting the file that ends with *.rvdata2.
 * Data/Scripts.rvdata2 does not be encrypted. it would be decompressed or deserialized using zlib and Marshal.load.
 *
 * zlib is famous library. so it can use in almost every languages and it is supported it in TypeScript too.
 * But Marshal is pretty exclusived in Ruby Languages. so it is not available in Typescript.
 *
 * How to convert serialized ruby string without Marshal.load of Ruby in Typescript?
 * The first one that I think was Marshal module
 *
 * marshal - https://www.npmjs.com/package/marshal
 *
 * However it was not work fine. so I used a way to execute ruby directly using node child process module.
 * So it's strongly coupled to the ruby language.
 *
 * This means that you have to install ruby interpreter on your system.
 */
export class RubyScriptService {
    protected _process!: cp.ChildProcess | undefined | null;
    protected _commandLineOptions: RubyRunnerCommandOptions;
    protected _callback: RubyProcessCallback;
    protected _args: string[] | undefined;

    get internel() {
        return this._process;
    }

    /**
     * DI(Dependency Injection) is used for this class.
     * so you have to inject the configService and the loggingService from the outside of this class.
     *
     * @param configService
     * @param loggingService
     * @param header
     * @param callback
     */
    constructor(
        protected readonly configService: ConfigService,
        protected readonly loggingService: LoggingService,
        header: RubyRunnerCommandOptions,
        callback: RubyProcessCallback
    ) {
        this._commandLineOptions = header;
        this._callback = callback;
        this._process = null;
        this._args = undefined;

        this.makeCommand();
    }

    /**
     * This function is responsible for making the command line options.
     */
    makeCommand() {
        const { vscodeWorkspaceFolder, scriptFile } = this._commandLineOptions;
        const extensionPath =
            this.configService.getExtensionContext().extensionPath;

        this.loggingService.info(
            `The current extension path is ${extensionPath}.`
        );
        const rubyFilePath = path.join(extensionPath, "RGSS3", "index.rb");

        this._args = [
            rubyFilePath,
            `--output="${vscodeWorkspaceFolder}"`,
            `--input="${scriptFile}"`,
        ];
    }

    /**
     * Executes the ruby script using the ruby interpreter is installed on your system.
     * if the ruby interpreter is not installed, it can't be executed.
     */
    run(): void | this {
        this._process = cp.execFile(
            `ruby`,
            this._args,
            {
                encoding: "utf8",
                maxBuffer: 1024 * 1024,
                cwd: this.configService.getExtensionContext().extensionPath,
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

    pendingTerminate() {
        if (!this._process) return;
        this._process.on("beforeExit", () => this._process!.kill());
    }

    onExit(callback: RubyProcessOnExitCallback) {
        if (!this._process) return;
        this._process.on("exit", callback);
    }
}

/**
 * @class RubyCompressScriptService
 * @description
 * This class is responsible for compressing the ruby script files as the file that ends with *.rvdata2
 * Data/Scripts.rvdata2 does not be encrypted. it would be compressed or serialized using zlib and Marshal.dump.
 *
 * zlib is famous library. so it can use in almost every languages and it is supported it in TypeScript too.
 * But Marshal is pretty exclusived in Ruby Languages. so it is not available in Typescript.
 *
 * How to convert serialized ruby string without Marshal.dump of Ruby in Typescript?
 * The first one that I think was Marshal module
 *
 * marshal - https://www.npmjs.com/package/marshal
 *
 * However it was not work fine. so I used a way to execute ruby directly using node child process module.
 * So it's strongly coupled to the ruby language.
 *
 * This means that you have to install ruby interpreter on your system.
 */
export class RubyCompressScriptService extends RubyScriptService {
    /**
     * Adds a new argument named '--compress' to inherited command line options.
     */
    makeCommand() {
        super.makeCommand();

        this._args?.push("--compress");
    }
}

/**
 * Extracts the game script files after running the Ruby interpreter.
 *
 * @param loggingService
 * @param rubyScriptService
 */
export function extractScriptFiles(
    loggingService: LoggingService,
    rubyScriptService: RubyScriptService
) {
    rubyScriptService.run()!.onExit((code: number, signal: any) => {
        loggingService.info(`${code} Script import is complete.`);
    });
    rubyScriptService.pendingTerminate();
}

/**
 * This function is responsible for creating all script files as one script bundle file after running the Ruby interpreter.
 *
 * @param loggingService
 * @param rubyScriptService
 */
export function compressScriptFiles<
    T extends RubyCompressScriptService = RubyCompressScriptService
>(loggingService: LoggingService, rubyScriptService: T) {
    rubyScriptService.run()!.onExit((code: number, signal: any) => {
        loggingService.info(`${code} Script Compile is complete.`);
    });
    rubyScriptService.pendingTerminate();
}
