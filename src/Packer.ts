import {
    compressScriptFiles,
    RubyCompressScriptService,
} from "./commands/ExtractScriptFiles";
import { ConfigService } from "./services/ConfigService";
import { LoggingService } from "./services/LoggingService";
import { Unpacker } from "./Unpacker";
import * as path from "path";
import { Path } from "./utils/Path";

const PACKER_IS_READY = "Packer is ready";

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
            .join(root, "Data", ConfigService.TARGET_SCRIPT_FILE_NAME)
            .replace(/\\/g, "/");

        this._targetFile = targetFile;
        this._isReady = true;
    }

    /**
     * This function is reponsible for serializing the ruby script files.
     * ? $RGSS_SCRIPTS has three elements such as [section_id, name, compressed_script using zlib]
     */
    pack() {
        if (!this._isReady) {
            this.loggingService.info(PACKER_IS_READY);
            throw new Error(PACKER_IS_READY);
        }

        this.updateTargetFile();
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
