import { execSync } from "child_process";
import fetch from "node-fetch";
import * as fs from "fs";

const rubyInstallerUrl = {
    windows:
        "https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.2.1-1/rubyinstaller-3.2.1-1-x64.exe",
};
const rubyInstallerPath = {
    windows: "rubyinstaller.exe",
};

export async function installRuby(): Promise<void> {
    let url = "";
    let downloadPath = "";

    if (process.platform !== "win32") {
        console.error("This command is only available on Windows.");
        return;
    }

    url = rubyInstallerUrl.windows;
    downloadPath = rubyInstallerPath.windows;

    try {
        await downloadFile(url, downloadPath);

        const installCommand = `${downloadPath} /verysilent`;
        execSync(installCommand);

        console.log("Completed to install Ruby.");
    } catch (error) {
        console.error("Failed to install Ruby.");
    } finally {
        fs.unlinkSync(downloadPath);
    }
}

async function downloadFile(url: string, dest: string): Promise<void> {
    const response = await fetch(url);
    const fileStream = fs.createWriteStream(dest);
    await new Promise<void>((resolve, reject) => {
        response.body?.pipe(fileStream);
        response.body?.on("error", (err) => {
            reject(err);
        });
        fileStream.on("finish", function () {
            resolve();
        });
    });
}
