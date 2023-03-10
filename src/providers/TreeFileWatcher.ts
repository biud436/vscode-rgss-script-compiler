import * as vscode from "vscode";
import { LoggingService } from "../LoggingService";
import { RGSSScriptSection } from "./RGSSScriptSection";
import { LoggingMarker } from "./ScriptViewer";

export type OnDidRenameFilesProps = {
    oldUrl: vscode.Uri;
    newUrl: vscode.Uri;
};

export class TreeFileWatcher implements vscode.Disposable {
    private _glob = "**/*.rb";
    private _watcher?: vscode.FileSystemWatcher;

    /**
     * 이벤트 드리븐 방식의 디커플링 패턴
     * `vscode.TreeDataProvider<ScriptSection>`가 아래 파일 이벤트를 구독한다.
     */
    public onDidRenameFiles = new vscode.EventEmitter<OnDidRenameFilesProps>();

    /**
     * 파일 생성 이벤트
     *
     * 트리를 info.txt로부터 다시 그릴 필요는 없지만, 기존 트리에 새로운 파일의 경로 값으로 데이터를 추가해야 한다.
     * 이때, Main.rb의 위쪽 또는 현재 선택된 파일의 아래쪽에 추가해야 한다.
     */
    public onDidCreate = new vscode.EventEmitter<vscode.Uri>();

    /**
     * 파일 변경 이벤트
     *
     * 트리 변경의 필요성이 있는지 검토해야 한다.
     */
    public onDidChange = new vscode.EventEmitter<vscode.Uri>();

    /**
     * 파일 삭제 이벤트
     *
     * 트리를 info.txt로부터 다시 그릴 필요는 없지만, 기존 트리에서 파일의 경로 값으로 데이터를 찾아 삭제 처리를 해야 한다.
     */
    public onDidDelete = new vscode.EventEmitter<vscode.Uri>();

    constructor(
        private readonly loggingService: LoggingService,
        glob = "**/*.rb"
    ) {
        this._glob = glob;
    }

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

                this.onDidRenameFiles.fire({
                    oldUrl: file.oldUri,
                    newUrl: file.newUri,
                });
            });
        });

        /**
         * 파일 생성 이벤트
         */
        this._watcher?.onDidCreate((event) => {
            this.onDidCreate.fire(event);
        });

        /**
         * 파일 변경 이벤트
         */
        this._watcher?.onDidChange((event) => {
            this.onDidChange.fire(event);
        });

        /**
         * 파일 삭제 이벤트
         */
        this._watcher?.onDidDelete((event) => {
            this.onDidDelete.fire(event);
        });
    }

    dispose() {
        this.onDidRenameFiles.dispose();
        this.onDidCreate.dispose();
        this.onDidChange.dispose();
        this.onDidDelete.dispose();
        this._watcher?.dispose();
    }
}
