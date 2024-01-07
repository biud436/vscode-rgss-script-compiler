import * as zlib from "zlib";

/**
 * 이 클래스는 Scripts.rvdata2 파일을 압축 해제 또는 압축하는 기능을 제공합니다.
 *
 * @class EncryptionManager
 */
export class EncryptionManager {
    static zlibInflate(str: Buffer): string {
        const z = zlib.inflateSync(str);

        return z.toString("utf-8");
    }
}
