import * as vscode from "vscode";
import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";

/**
 * 메인 게임 폴더를 설정합니다.
 *
 * @param logging
 */
export function setGamePath(
    configService: ConfigService,
    loggingService: LoggingService
) {
    vscode.window
        .showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "게임 폴더 설정",
        })
        .then((value) => {
            if (value) {
                loggingService.info(
                    `설정된 게임 폴더는 ${value[0].fsPath} 입니다`
                );
                configService.setGameFolder(value[0]);
            }
        });
}
