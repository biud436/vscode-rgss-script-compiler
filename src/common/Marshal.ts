import { DumpOptions, LoadOptions, dump, load } from "@hyrious/marshal";

export type ScriptTuple = [number, Buffer, Buffer];

/**
 * @hyrious/marshal의 Ruby Marshal을 래핑하는 클래스입니다.
 * CRuby의 Marshal과 호환되며 Ruby Marshal을 사용하는 모든 프로그램에서 사용할 수 있습니다.
 * Ruby가 설치되어있지 않은 시스템에서도 Scripts.rvdata2 파일을 읽고 쓸 수 있습니다.
 *
 * @class Marshal
 */
export class Marshal {
    /**
     * 직렬화된 스크립트를 읽고 NodeJS에서 읽을 수 있는 형태로 변환합니다.
     *
     * @param data fs.readFileSync 등으로 읽은 파일 버퍼를 전달하세요.
     * @param options
     * @returns
     */
    static load(
        data: string | Uint8Array | ArrayBuffer,
        options?: LoadOptions,
    ): ScriptTuple[] {
        return load(data, {
            ...options,
            // 테스트 결과, 이 옵션을 지정하지 않으면 chunk 관련 오류가 납니다.
            string: "binary",
        }) as ScriptTuple[];
    }

    static dump(value: unknown, options?: DumpOptions): Uint8Array {
        return dump(value);
    }
}
