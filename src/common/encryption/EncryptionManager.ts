import * as zlib from "zlib";
import * as path from "path";
import * as fs from "fs";
import { Events } from "../../events/EventHandler";
import { Marshal } from "../Marshal";
import { Path } from "../../utils/Path";

export class EncryptionManager {
    static zlibInflate(str: Buffer): string {
        const z = zlib.inflateSync(str);

        return z.toString("utf-8");
    }

    static zlibDeflate(str: Buffer | string) {
        const z = zlib.deflateSync(str);
        return z;
    }

    static async extractFiles(
        vscodeWorkspaceFolder: string,
        scriptFile: string,
    ) {
        Events.emit("info", "Creating index file for the script files.");

        const targetFolder = Path.join(vscodeWorkspaceFolder, "Scripts");
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }

        const scripts = Marshal.load(scriptFile);

        const scriptNames: string[] = [];
        for (const script of scripts) {
            const [, name, content] = script;
            const scriptContent = EncryptionManager.zlibInflate(content);
            const scriptName = Buffer.from(name).toString("utf-8");

            // IO 병목
            await fs.promises.writeFile(
                path.join(targetFolder, `${scriptName}.rb`),
                scriptContent,
                "utf-8",
            );

            scriptNames.push(scriptName);
        }

        fs.writeFileSync(
            path.join(targetFolder, "info.txt"),
            scriptNames.join("\n"),
            "utf-8",
        );

        Events.emit("info", "Script files have been extracted.");
    }
}
