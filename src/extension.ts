import * as vscode from "vscode";
import { RubyScriptService } from "./commands/ExtractScriptFiles";
import { setGamePath } from "./commands/SetGamePath";
import { ConfigService } from "./ConfigService";
import { LoggingService } from "./LoggingService";
import { Packer } from "./Packer";
import { Unpacker } from "./Unpacker";

export function activate(context: vscode.ExtensionContext) {
  const loggingService = new LoggingService();
  const configService: ConfigService = new ConfigService();
  let isReady = false;

  // 컨텍스트 설정
  configService.setExtensionContext(context);

  if (!vscode.workspace.workspaceFolders) {
    loggingService.info("작업 폴더가 지정되어 있지 않습니다.");
    throw new Error("작업 폴더가 지정되어 있지 않습니다.");
  }

  const workspaces = vscode.workspace.workspaceFolders;
  configService.setVSCodeWorkSpace(workspaces[0].uri);

  loggingService.info("RGSS Script Compiler가 실행되었습니다");

  // 게임 폴더 설정
  const setGamePathCommand = vscode.commands.registerCommand(
    "rgss-script-compiler.setGamePath",
    () => {
      setGamePath(configService, loggingService);
    }
  );

  const unpackCommand = vscode.commands.registerCommand(
    "rgss-script-compiler.unpack",
    () => {
      if (!configService) {
        loggingService.info("작업 폴더가 없습니다.");
        return;
      }

      loggingService.info(
        `작업 폴더는 ${configService.getMainGameFolder().fsPath} 입니다.`
      );

      const unpacker = new Unpacker(configService, loggingService);
      unpacker.unpack();
    }
  );

  const compileCommand = vscode.commands.registerCommand(
    "rgss-script-compiler.compile",
    () => {
      if (!configService) {
        loggingService.info("작업 폴더가 없습니다.");
        return;
      }

      loggingService.info(
        `작업 폴더는 ${configService.getMainGameFolder().fsPath} 입니다.`
      );

      const bundler = new Packer(configService, loggingService);
      bundler.pack();
    }
  );

  loggingService.show();

  context.subscriptions.push(setGamePathCommand, unpackCommand, compileCommand);
}

export function deactivate() {}
