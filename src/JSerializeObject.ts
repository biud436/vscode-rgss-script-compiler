import { RGSS } from "./RGSS";

/**
 * @class JSerializeObject
 * @description This class is responsible for serializing and deserializing the config object.
 */

export class JSerializeObject {
    constructor(private readonly data: RGSS.JSerializeData) {}

    toBuffer(): Buffer {
        return Buffer.from(JSON.stringify(this.data), "utf8");
    }

    static of(data: Uint8Array): RGSS.JSerializeData {
        return JSON.parse(Buffer.from(data).toString("utf8"));
    }
}
