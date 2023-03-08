type FilterPredicate<T> = (value: T, index: number, array: T[]) => boolean;

/**
 * 스크립트를 트리 구조로 관리하기 위한 프록시 클래스이다.
 * Proxy 클래스로 구현된 이유는, File Watcher와 통합하여 코드의 간결성을 유지하기 위함이다.
 *
 * File Watcher는 파일의 변경을 감지하고, 변경된 파일을 트리 구조에 반영한다.
 * File Watcher가 현재 바깥에 있는데, 이 부분을 나중에 구현하여 통합할 예정이다.
 *
 * 하지만 스크립트 트리의 인스턴스가 유일하다는 가정이 있어야 한다.
 * 그러나 현재는 splice나 filter에 의해 스크립트 트리의 인스턴스가 여러 개 생성되고 있다.
 * 이 상태에서는 dispose가 여러번 호출되므로 자원을 낭비하게 된다.
 *
 * 따라서 아직까진 File Watcher를 통합하기가 힘들다.
 *
 * @class ScriptTree
 */
export class ScriptTree<T> {
    data: T[];

    constructor(array: T[]) {
        this.data = array;
    }

    public filter(callback: FilterPredicate<T>): ScriptTree<T> {
        return new ScriptTree(this.data.filter(callback));
    }

    public splice(
        start: number,
        deleteCount: number,
        ...items: T[]
    ): ScriptTree<T> {
        return new ScriptTree(this.data.splice(start, deleteCount, ...items));
    }

    public findIndex(callback: FilterPredicate<T>): number {
        return this.data.findIndex(callback);
    }

    public find(callback: FilterPredicate<T>): T | undefined {
        return this.data.find(callback);
    }

    get length(): number {
        return this.data.length;
    }

    /**
     * for ... of 로 접근할 수 있도록 iterator를 구현한다.
     * @returns
     */
    public [Symbol.iterator](): Iterator<T> {
        return this.data[Symbol.iterator]();
    }

    public getChildren(): T[] {
        return this.data;
    }
}
