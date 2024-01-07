import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { v4 as uuidv4 } from "uuid";
import { load, dump, DumpOptions, LoadOptions } from "@hyrious/marshal";

class Marshal {
    static load(
        data: string | Uint8Array | ArrayBuffer,
        options?: LoadOptions,
    ) {
        return load(data, {
            ...options,
            string: "binary",
        });
    }

    static dump(value: unknown, options?: DumpOptions): Uint8Array {
        return dump(value, options);
    }
}

class Store {
    public static usedSections: number[] = [];

    static getRandomSection() {
        let section: number;
        do {
            section = Math.floor(Math.random() * 2147483647);
        } while (this.usedSections.includes(section));
        this.usedSections.push(section);
        return section;
    }

    static zlibInflate(str: Buffer) {
        const z = zlib.inflateSync(str);

        return z.toString("utf-8");
    }

    static zlibDeflate(str: string): Buffer {
        const z = zlib.deflateSync(str);

        return z;
    }
}

const targetDir = [__dirname, "example"];
const targetFile = path.join(...targetDir, "Scripts.rvdata2");
const file = fs.readFileSync(targetFile);

type ScriptTuple = [number, Buffer, Buffer];

describe("Marshal.load", () => {
    it("Game_System이 포함되어 있는지 확인한다.", () => {
        const scripts = Marshal.load(file) as ScriptTuple[];
        const names: string[] = [];

        for (const script of scripts) {
            const [, name] = script;

            const scriptName = Buffer.from(name).toString("utf-8");
            names.push(scriptName);
        }

        expect(names).toContain("Game_System");
    });

    it("파일을 읽고 Marshal.load를 통해 스크립트 내용을 출력한다.", () => {
        const scripts = Marshal.load(file) as ScriptTuple[];
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
                console.log(scriptContent);
            }
        }

        expect(main.name).toEqual("Main");
        expect(main.content).toContain("rgss_main { SceneManager.run }");
    });
});
