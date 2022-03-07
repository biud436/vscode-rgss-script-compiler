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

  makeCommand() {
    const { vscodeWorkspaceFolder, scriptFile } = this._commandLineOptions;
    const extensionPath =
      this.configService.getExtensionContext().extensionPath;

    this.loggingService.info(`The current extension path is ${extensionPath}.`);
    const rubyFilePath = path.join(extensionPath, "RGSS3", "index.rb");

    this._args = [
      rubyFilePath,
      `--output="${vscodeWorkspaceFolder}"`,
      `--input="${scriptFile}"`,
    ];
  }

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

export class RubyCompressScriptService extends RubyScriptService {
  makeCommand() {
    super.makeCommand();

    this._args?.push("--compress");
  }
}

export function extractScriptFiles(
  loggingService: LoggingService,
  rubyScriptService: RubyScriptService
) {
  rubyScriptService.run()!.onExit((code: number, signal: any) => {
    loggingService.info(`${code} 스크립트 추출이 완료되었습니다.`);
  });
  rubyScriptService.pendingTerminate();
}

export function compressScriptFiles<
  T extends RubyCompressScriptService = RubyCompressScriptService
>(loggingService: LoggingService, rubyScriptService: T) {
  rubyScriptService.run()!.onExit((code: number, signal: any) => {
    loggingService.info(`${code} 스크립트 컴파일이 완료되었습니다.`);
  });
  rubyScriptService.pendingTerminate();
}
