import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import * as crypto from "crypto";
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
        return dump(value, {
            ...options,
        });
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

const outputFile = path.join(...targetDir, `${uuidv4()}.rvdata2`);

type ScriptTuple = [number, Buffer | Uint8Array, Buffer];

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
            }
        }

        expect(main.name).toEqual("Main");
        expect(main.content).toContain("rgss_main { SceneManager.run }");
    });

    it("스크립트를 생성하고 다시 읽는다", () => {
        const dummyScript = "rgss_main { SceneManager.run }";

        const scripts: ScriptTuple[] = [];
        const encoder = new TextEncoder();
        scripts.push(
            [
                Store.getRandomSection(),
                Buffer.from("Game_System", "utf-8"),
                // encoder.encode("Game_System"),
                Store.zlibDeflate(`class Game_System; end`),
            ],
            [
                Store.getRandomSection(),
                Buffer.from("Main", "utf-8"),
                // encoder.encode("Main"),
                Store.zlibDeflate(dummyScript),
            ],
        );

        console.log(scripts);

        const data = Marshal.dump(scripts);

        fs.writeFileSync(outputFile, data);

        function read() {
            const fileBuffer = fs.readFileSync(outputFile);

            const scripts = Marshal.load(fileBuffer) as ScriptTuple[];
            const main = {
                name: "",
                content: "",
            };

            for (const script of scripts) {
                const [, name, content] = script;

                const scriptContent = Store.zlibInflate(content);
                const scriptName = Buffer.from(name).toString("utf-8");
                console.log("name", scriptName);

                if (scriptName === "Main") {
                    main.name = scriptName;
                    main.content = scriptContent;
                    console.log(scriptContent);
                }
            }

            return main;
        }

        const main = read();

        expect(main.name).toEqual("Main");
    });

    it("스크립트를 읽고, load & dump하여 파일이 같은 지 확인한다.", () => {
        function getHash(filePath: string) {
            const fileBuffer = fs.readFileSync(filePath);

            const hash = crypto.createHash("sha256");
            hash.update(fileBuffer);

            const fileHash = hash.digest("hex");

            return fileHash;
        }

        // 스크립트를 읽는다.
        const scripts = Marshal.load(file) as ScriptTuple[];

        const items: ScriptTuple[] = [];

        for (const script of scripts) {
            const [uuid, name, content] = script;

            // 압축을 해제한다.
            const scriptContent = Store.zlibInflate(content);
            const scriptName = Buffer.from(name).toString("utf-8");

            // 다시 압축한다.
            items.push([
                uuid,
                Buffer.from(scriptName),
                Store.zlibDeflate(scriptContent),
            ]);
        }

        const data = Marshal.dump(items);

        fs.writeFileSync(outputFile, data);

        const crc1 = getHash(targetFile);
        const crc2 = getHash(outputFile);

        // 같은 파일이 아님
        expect(crc1).toEqual(crc2);
    });

    afterAll(() => {
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
    });
});
