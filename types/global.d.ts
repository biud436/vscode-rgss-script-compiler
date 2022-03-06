declare module "marshal" {
    export default class Marshal {
        buffer: Buffer;
        _index: number;

        constructor(data: string, encoding?: string);
        constructor(data: Buffer, encoding?: string);
        load(buffer: Buffer, encoding: string): Marshal;
        load(buffer: string, encoding: string): Marshal;
        toString(encoding: BufferEncoding): string;
        toJSON(): { [key: string]: any };
    }
}
