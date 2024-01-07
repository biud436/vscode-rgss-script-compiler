/**
 * 전역 상태를 관리하는 스토어 클래스입니다.
 * 이 확장에선 제가 주로 사용하는 데코레이터 기반 DI 솔루션을 사용하지 않았기 때문에
 * 부득이하게 다수의 객체에서 커플링 상태로 존재하는 변수들이 존재합니다.
 *
 * @class GlobalStore
 */
export class GlobalStore {
    /**
     * 루비 설치 여부.
     * 루비가 설치되어 있지 않으면 @hyrious/marshal을 사용해야 합니다.
     */
    private isRubyInstalled: boolean;

    constructor() {
        this.isRubyInstalled = false;
    }

    /**
     * Ruby가 설치되어 있는지 확인합니다.
     * @returns
     */
    public getIsRubyInstalled() {
        return this.isRubyInstalled;
    }

    /**
     * 루비가 설치되어 있는지 여부를 설정합니다.
     * @param isRubyInstalled
     */
    public setIsRubyInstalled(isRubyInstalled: boolean) {
        this.isRubyInstalled = isRubyInstalled;
    }
}

export const store = new GlobalStore();
