import * as vscode from "vscode";
import { ConfigService } from "../ConfigService";
import { LoggingService } from "../LoggingService";
import { Path } from "../utils/Path";

/**
 * 메인 게임 폴더를 설정합니다.
 *
 * @param logging
 */
export async function setGamePath(
  configService: ConfigService,
  loggingService: LoggingService
) {
  const value = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Set Game Folder",
  });

  if (value) {
    configService.setGameFolder(value[0]);
    await configService.saveConfig();
  }
}
