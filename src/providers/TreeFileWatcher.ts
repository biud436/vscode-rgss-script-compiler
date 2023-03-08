import * as vscode from "vscode";
import { LoggingService } from "../LoggingService";
import { RGSSScriptSection } from "./RGSSScriptSection";
import { LoggingMarker } from "./ScriptViewer";

export class TreeFileWatcher implements vscode.Disposable {
    private _glob = "**/*.rb";
    private _watcher?: vscode.FileSystemWatcher;

    public subscriptions = new vscode.EventEmitter<RGSSScriptSection>();

    constructor(private readonly loggingService: LoggingService) {}

    create() {
        this._watcher = vscode.workspace.createFileSystemWatcher(this._glob);

        this.initWithEvents();
    }

    async initWithEvents() {
        /**
         * 파일 이름 변경 이벤트
         */
        vscode.workspace.onDidRenameFiles((event) => {
            event.files.forEach((file) => {
                console.log(`${file.oldUri} -> ${file.newUri}`);
            });
        });

        /**
         * 파일 생성 이벤트
         */
        this._watcher?.onDidCreate((event) => {
            this.loggingService.info(
                `[file ${LoggingMarker.CREATED}] ${JSON.stringify(event)}`
            );
        });

        /**
         * 파일 변경 이벤트
         */
        this._watcher?.onDidChange((event) => {
            this.loggingService.info(
                `[file ${LoggingMarker.CHANGED}] ${JSON.stringify(event)}`
            );
        });

        /**
         * 파일 삭제 이벤트
         */
        this._watcher?.onDidDelete((event) => {
            this.loggingService.info(
                `[file ${LoggingMarker.DELETED}] ${JSON.stringify(event)}`
            );
        });
    }

    dispose() {
        this._watcher?.dispose();
    }
}
