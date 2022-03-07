import {
  compressScriptFiles,
  RubyCompressScriptService,
  RubyScriptService,
} from "./commands/ExtractScriptFiles";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import { TARGET_SCRIPT_FILE_NAME, Unpacker } from "./Unpacker";
import * as path from "path";
import { Path } from "./utils/Path";

export class Packer extends Unpacker {
  constructor(configService: ConfigService, loggingService: LoggingService) {
    super(configService, loggingService);
  }

  /**
   * Sets the target file from the main game folder.
   * it is assumed that the file extension is one of ruby serialized files(*.rvdata2, *.rvdata, *.rxdata)
   */
  initWithTargetFile() {
    const root = Path.resolve(this.configService.getMainGameFolder());
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
          vscodeWorkspaceFolder: Path.resolve(
            this.configService.getVSCodeWorkSpace()
          ),
          scriptFile: targetFile,
        },
        (err: any, stdout: any, stderr: any) => {
          if (err) {
            this.loggingService.info(err);
          }
          this.loggingService.info("Job completed.");
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
