import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Path } from "./utils/Path";
import { LoggingService } from "./LoggingService";
import { Mutex } from "./Mutex";

namespace RGSS {
    export type VERSION = "RGSS1" | "RGSS2" | "RGSS3";

    export type config = {
        /**
         * Sets or Gets the path of the main game folder.
         */
        mainGameFolder?: vscode.Uri;
        /**
         * Sets or Gets the path of the workspace.
         */
        workSpace?: vscode.Uri;

        /**
         * Sets or Gets the path of the extension folder.
         */
        extensionContext?: vscode.ExtensionContext;

        /**
         * Sets or Gets the RGSS version.
         */
        rgssVersion?: VERSION;
    };

    export type MapOfPath = "RGSS1" | "RGSS2" | "RGSS3";

    export type Path = {
        [key in MapOfPath]: vscode.Uri;
    } & {
        RGSS1: vscode.Uri;
        RGSS2: vscode.Uri;
        RGSS3: vscode.Uri;
    };
}

export class ConfigService {
    /**
     * Gets or Sets the configuration.
     */
    private config: RGSS.config;

    /**
     * ! ON LOAD GAME FOLDER EVENT DISPATCHER.
     *
     * Creates an event that is fired when the main game folder is changed.
     */
    public ON_LOAD_GAME_FOLDER: vscode.EventEmitter<string> =
        new vscode.EventEmitter<string>();

    /**
     * ! ON LOAD RGSS VERSION EVENT DISPATCHER
     */
    private ON_LOAD_RGSS_VERSION: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>();

    /**
     * TARGET_SCRIPT_FILE_NAME
     */
    public static TARGET_SCRIPT_FILE_NAME = "Scripts.rvdata2";

    constructor(private readonly loggingService: LoggingService) {
        this.config = {};
    }

    /**
     * This function is responsible for setting the main game folder to config file.
     *
     * @param gameFolder
     */
    public async setGameFolder(gameFolder: vscode.Uri) {
        this.config.mainGameFolder = gameFolder;
        this.detectRGSSVersion();
    }

    /**
     * Writes a file named "rgss-compiler.json" in the workspace folder.
     *
     * @returns
     */
    public async saveConfig(): Promise<string | undefined> {
        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage(
                "No folder or workspace opened"
            );
        }

        const folderUri = vscode.workspace.workspaceFolders![0].uri;
        const fileUri = folderUri.with({
            path: path.posix.join(folderUri.path, "rgss-compiler.json"),
        });

        await vscode.workspace.fs.writeFile(
            fileUri,
            Buffer.from(
                JSON.stringify({
                    mainGameFolder: path.posix.join(
                        this.config.mainGameFolder?.path!
                    ),
                    rgssVersion: this.config.rgssVersion,
                }),
                "utf8"
            )
        );
    }

    /**
     * Loads a file named "rgss-compiler.json" in the workspace folder.
     *
     * @param loggingService
     * @returns
     */
    public async loadConfig(
        loggingService?: LoggingService
    ): Promise<string | undefined> {
        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage(
                "No folder or workspace opened"
            );
        }

        const folderUri = vscode.workspace.workspaceFolders![0].uri;
        const fileUri = folderUri.with({
            path: path.posix.join(folderUri.path, "rgss-compiler.json"),
        });
        const readData = await vscode.workspace.fs.readFile(fileUri);
        const jsonData = Buffer.from(readData).toString("utf8");
        this.config = {
            ...this.config,
            mainGameFolder: vscode.Uri.file(
                JSON.parse(jsonData).mainGameFolder
            ),
        };

        vscode.window.showInformationMessage(jsonData);
    }

    /**
     * Sets the workspace in user's visual studio code.
     *
     * @param workingFolder
     */
    public setVSCodeWorkSpace(workingFolder: vscode.Uri) {
        this.config.workSpace = workingFolder;
    }

    /**
     * Sets the extension context.
     *
     * @param context
     */
    public setExtensionContext(context: vscode.ExtensionContext) {
        this.config.extensionContext = context;
    }

    /**
     * Gets the extension context.
     *
     * @returns
     */
    public getExtensionContext(): vscode.ExtensionContext {
        return this.config.extensionContext!;
    }

    /**
     * Returns the main game folder.
     * Note that this return type is not a string, it is a vscode.Uri type.
     * you should use the path.posix.join() function if you are using the path information in the vscode extension.
     *
     * @returns the main game folder.
     */
    public getMainGameFolder(): vscode.Uri {
        return this.config.mainGameFolder!;
    }

    /**
     * Gets the workspace in user's visual studio code.
     */
    public getVSCodeWorkSpace(): vscode.Uri {
        return this.config.workSpace!;
    }

    /**
     * Gets the configuraiton object.
     */
    public getConfig(): RGSS.config {
        return this.config;
    }

    /**
     * Gets Ruby Game Scripting's version.
     * This value is one of "RGSS1", "RGSS2", "RGSS3"
     */
    public getRGSSVersion(): RGSS.MapOfPath {
        return this.config.rgssVersion!;
    }

    /**
     * Detects the Ruby Game Scripting System version.
     */
    public async detectRGSSVersion() {
        if (this.config.rgssVersion) {
            return this.config.rgssVersion;
        }

        const gameFolderUri = this.getMainGameFolder();
        const version = <RGSS.Path>{
            RGSS1: gameFolderUri.with({
                path: path.posix.join("Data", "Scripts.rxdata"),
            }),
            RGSS2: gameFolderUri.with({
                path: path.posix.join("Data", "Scripts.rvdata"),
            }),
            RGSS3: gameFolderUri.with({
                path: path.posix.join("Data", "Scripts.rvdata2"),
            }),
        };

        // Finds the version of RGSS (asynchronous)
        const mutex = new Mutex<number>();
        Array.from<keyof RGSS.Path>(["RGSS1", "RGSS2", "RGSS3"]).forEach(
            async (key) => {
                const unlock = await mutex.lock();

                // File System API of Node.js didn't work in the Visual Studio Code Extension.
                // This is alternative behavior of the function called "fs.existsSync"
                try {
                    const isValid = await vscode.workspace.fs.stat(
                        this.getMainGameFolder().with({
                            path: path.posix.join(
                                this.getMainGameFolder().path,
                                version[key].path
                            ),
                        })
                    );

                    if (isValid) {
                        this.config.rgssVersion = <RGSS.MapOfPath>key;
                    }

                    // Occurs an event to notify the completion of processing.
                    this.ON_LOAD_RGSS_VERSION.fire();
                    this.ON_LOAD_GAME_FOLDER.fire(
                        Path.resolve(this.getMainGameFolder())
                    );
                } catch {}
                unlock();
            }
        );

        // Receives the results of the event processing.
        this.ON_LOAD_RGSS_VERSION.event(async () => {
            switch (this.config.rgssVersion!) {
                case "RGSS1":
                    ConfigService.TARGET_SCRIPT_FILE_NAME = "Scripts.rxdata";
                    break;
                case "RGSS2":
                    ConfigService.TARGET_SCRIPT_FILE_NAME = "Scripts.rvdata";
                    break;
                default:
                case "RGSS3":
                    ConfigService.TARGET_SCRIPT_FILE_NAME = "Scripts.rvdata2";
                    break;
            }
            this.loggingService.info(
                `RGSS Version is the same as ${this.config.rgssVersion}`
            );
            await this.saveConfig();
        });

        return this.config.rgssVersion;
    }
}
