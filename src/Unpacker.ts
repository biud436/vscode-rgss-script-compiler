/* eslint-disable @typescript-eslint/naming-convention */
import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "./services/ConfigService";
import { LoggingService } from "./services/LoggingService";
import {
    extractScriptFiles,
    RubyScriptService,
} from "./commands/ExtractScriptFiles";
import { Path } from "./utils/Path";

const message = {
    UNPACKER_NOT_READY: "Unpacker is not ready.",
    JOB_COMPLETED: "Job completed.",
};

namespace RGSS {
    export const TARGET_SCRIPT_FILE_NAME = "Scripts.rvdata2";
    export class Unpacker {
        protected _targetFile: string;
        protected _isReady: boolean;

        constructor(
            protected readonly configService: ConfigService,
            protected readonly loggingService: LoggingService,
            protected readonly successCallback?: () => void,
        ) {
            this._targetFile = "";
            this._isReady = false;

            this.start();
        }

        start() {
            this.initWithTargetFile();
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

            if (!fs.existsSync(targetFile)) {
                this.loggingService.info(`${targetFile} not found.`);
                throw new Error(
                    `Data/${ConfigService.TARGET_SCRIPT_FILE_NAME} not found.`,
                );
            }

            this._targetFile = targetFile;
            this._isReady = true;
        }

        updateTargetFile() {
            this.initWithTargetFile();
        }

        public static isExistFile(configService: ConfigService) {
            const root = Path.resolve(configService.getMainGameFolder());
            const targetFile = path
                .join(root, "Data", ConfigService.TARGET_SCRIPT_FILE_NAME)
                .replace(/\\/g, "/");

            return !fs.existsSync(targetFile);
        }

        /**
         * Extract script files to vscode workspace.
         */
        unpack() {
            if (!this._isReady) {
                this.loggingService.info(message.UNPACKER_NOT_READY);
                throw new Error(message.UNPACKER_NOT_READY);
            }

            this.updateTargetFile();
            const targetFile = <string>this._targetFile;

            try {
                // Create ruby script service
                const rubyScriptService = new RubyScriptService(
                    this.configService,
                    this.loggingService,
                    {
                        vscodeWorkspaceFolder: Path.resolve(
                            this.configService.getVSCodeWorkSpace(),
                        ),
                        scriptFile: targetFile,
                    },
                    (err: any, stdout: any, stderr: any) => {
                        if (err) {
                            this.loggingService.info(err);
                        }
                        this.loggingService.info(message.JOB_COMPLETED);
                    },
                );

                extractScriptFiles(
                    this.loggingService,
                    rubyScriptService,
                    this.successCallback,
                );
            } catch (e) {
                this.loggingService.info((<Error>e).message);
            }
        }
    }
}

export = RGSS;
