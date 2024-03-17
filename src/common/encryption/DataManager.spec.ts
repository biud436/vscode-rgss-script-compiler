import * as fs from "fs";
import * as path from "path";
import * as marshal from "@hyrious/marshal";
import * as zlib from "zlib";

const file = fs.readFileSync(
    path.join(process.cwd(), "src", "Scripts.rvdata2"),
);

class Marshal {
    static load(
        data: string | Uint8Array | ArrayBuffer,
        options?: marshal.LoadOptions | undefined,
    ) {
        return marshal.load(data, {
            ...options,
            string: "binary",
        });
    }

    static dump(data: unknown, options?: marshal.DumpOptions | undefined) {
        return marshal.dump(data, {
            ...options,
        });
    }
}

class Store {
    static usedSections: number[] = [];

    static getRandomSection() {
        let section: number;
        do {
            section = Math.floor(Math.random() * 2147483647);
        } while (this.usedSections.includes(section));
        this.usedSections.push(section);
        return section;
    }
    static zlibInflate(str: Buffer | string) {
        const z = zlib.inflateSync(str);
        return z.toString("utf-8");
    }
    static zlibDeflate(str: Buffer | string) {
        const z = zlib.deflateSync(str);
        return z;
    }
}

/**
 * Game_System이 포함되어 있는지 확인한다.
 */
function checkGameSystem() {
    const scripts = Marshal.load(file) as [number, string][];
    const names = [];
    for (const script of scripts) {
        const [, name] = script;
        const scriptName = Buffer.from(name).toString("utf-8");
        names.push(scriptName);

        console.log(scriptName);
    }

    return names.includes("Game_System");
}

/**
 * 파일을 읽고 Marshal.load를 통해 스크립트 내용을 출력한다.
 */
function printScriptContents() {
    const scripts = Marshal.load(file) as [number, Buffer, Buffer][];
    const main = {
        name: "",
        content: "",
    };
    for (const script of scripts) {
        const [, name, content] = script;
        const scriptContent = Store.zlibInflate(content);
        const scriptName = Buffer.from(name).toString("utf-8");
        if (scriptName === "Main") {
            main.name = scriptName;
            main.content = scriptContent;
        }
    }

    return main;
}

/**
 * 스크립트를 생성하고 다시 읽는다
 */
function echoScriptContents() {
    const outputFile = path.join("src", `output.rvdata2`);

    const dummyScript = "rgss_main { SceneManager.run }";
    const scripts = [];
    scripts.push(
        [
            Store.getRandomSection(),
            Buffer.from("Game_System", "utf-8"),
            Store.zlibDeflate(`class Game_System; end`),
        ],
        [
            Store.getRandomSection(),
            Buffer.from("Main", "utf-8"),
            Store.zlibDeflate(dummyScript),
        ],
    );
    const data = Marshal.dump(scripts);
    fs.writeFileSync(outputFile, data);

    function read() {
        const fileBuffer = fs.readFileSync(outputFile);
        const scripts = Marshal.load(fileBuffer) as [number, Buffer, Buffer][];
        const main = {
            name: "",
            content: "",
        };
        for (const script of scripts) {
            const [, name, content] = script;
            const scriptContent = Store.zlibInflate(content);
            const scriptName = Buffer.from(name).toString("utf-8");
            if (scriptName === "Main") {
                main.name = scriptName;
                main.content = scriptContent;
            }
        }
        return main;
    }
    const main = read();

    return main;
}

/**
 * Scripts.rvdata2 파일을 읽고, Marshal.load를 하고, 새로운 스크립트를 추가한다.
 * 그리고 다시 Marshal.dump를 통해 output2.rvdata2 파일을 생성한다.
 */
function echoScripts() {
    const outputFile = path.join("src", `output2.rvdata2`);
    const fileBuffer = fs.readFileSync(
        path.join(process.cwd(), "src", "Scripts.rvdata2"),
    );
    const scripts = Marshal.load(fileBuffer) as [number, Buffer, Buffer][];
    const result = [];

    for (const script of scripts) {
        const [, name, content] = script;
        const scriptContent = Store.zlibInflate(content);
        const scriptName = Buffer.from(name).toString("utf-8");

        result.push(script);

        // Main 스크립트 다음에 새로운 내용을 추가한다.
        if (scriptName === "Main") {
            const newScript = "print 'Hello, World!'";
            const newContent = Store.zlibDeflate(newScript);
            const newSection = Store.getRandomSection();

            result.push([
                newSection,
                Buffer.from("NewScript", "utf-8"),
                newContent,
            ]);
        }
    }

    const data = Marshal.dump(result);
    fs.writeFileSync(outputFile, data);

    // outputFile 파일을 읽는다
    const fileBuffer2 = fs.readFileSync(outputFile);

    // Marshal.load를 통해 스크립트를 읽는다.
    const scripts2 = Marshal.load(fileBuffer2) as [number, Buffer, Buffer][];

    for (const script of scripts2) {
        const [, name, content] = script;
        const scriptContent = Store.zlibInflate(content);
        const scriptName = Buffer.from(name).toString("utf-8");
        console.log(scriptName);
        console.log(scriptContent);
    }

    return true;
}

console.log(checkGameSystem());
console.log(printScriptContents());
console.log(echoScriptContents());
console.log(echoScripts());
