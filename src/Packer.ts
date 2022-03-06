import {
  compressScriptFiles,
  RubyCompressScriptService,
  RubyScriptService,
} from "./commands/ExtractScriptFiles";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import { TARGET_SCRIPT_FILE_NAME, Unpacker } from "./Unpacker";
import * as path from "path";

export class Packer extends Unpacker {
  constructor(configService: ConfigService, loggingService: LoggingService) {
    super(configService, loggingService);
  }

  initWithTargetFile() {
    const root = this.configService.getMainGameFolder().fsPath;
    const targetFile = path
      .join(root, "Data", TARGET_SCRIPT_FILE_NAME)
      .replace(/\\/g, "/");

    this._targetFile = targetFile;
    this._isReady = true;
  }

  pack() {
    if (!this._isReady) {
      this.loggingService.info("Unpacker is not ready.");
      throw new Error("Unpacker is not ready.");
    }

    const targetFile = <string>this._targetFile;

    try {
      // Create ruby script service
      const rubyScriptService = new RubyCompressScriptService(
        this.configService,
        this.loggingService,
        {
          vscodeWorkspaceFolder: this.configService.getVSCodeWorkSpace().fsPath,
          scriptFile: targetFile,
        },
        (err: any, stdout: any, stderr: any) => {
          if (err) {
            this.loggingService.info(err);
          }
          this.loggingService.info("컴파일이 완료되었습니다");
        }
      );

      compressScriptFiles<RubyCompressScriptService>(
        this.loggingService,
        rubyScriptService
      );
    } catch (e) {
      this.loggingService.info((<Error>e).message);
    }
  }
}
