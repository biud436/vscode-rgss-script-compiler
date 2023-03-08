type FilterPredicate<T> = (value: T, index: number, array: T[]) => boolean;

/**
 * `ScriptTree<T>` 클래스는 스크립트를 트리 구조로 관리하기 위한 프록시 클래스이다.
 * `Proxy`로 구현된 이유는, 최대한 배열을 모방하고 `File Watcher`와 통합하여 코드의 간결성을 유지하기 위함이다.
 * `File Watcher`는 파일의 변경을 감지하고, 변경된 파일을 트리 구조에 반영하는 기능을 가지고 있다.
 *
 * `File Watcher`가 현재 스크립트 뷰어 클래스 쪽에 있는데, 이 부분을 나중에 스크립트 트리 클래스로 옮겨와서 통합 작업을 해야 한다.
 * 하지만 통합을 하려면 스크립트 트리의 인스턴스가 유일하다는 가정이 있어야 한다.
 *
 * 그러나 현재는 배열 특성상 `splice`나 `filter`에 의해 스크립트 트리의 인스턴스가 여러 개 생성될 수 밖에 없다.
 *
 * `splice`는 통상적으로 배열의 원소를 직접 변경하지만 `ScriptTree<T>`의 구현에서는 복제본을 반환하게 해두었다. `filter`도 복제본을 반환한다.
 * 이 상태에서는 `dispose`가 여러 번 호출되므로 자원을 낭비하게 된다. 따라서 아직까진 `File Watcher`를 통합하기가 힘들다. 이 부분을 고민해야 한다.
 *
 * `File Watcher` 클래스가 여러번 생성되면 내부에 생성되는 이벤트의 자원 낭비 때문에 곤란하기 때문이다.
 * 자원 낭비의 여파가 어떤 영향을 미칠 지는 정확히 알 수 없다.
 *
 * 한 가지 분명한 건, 자원 낭비를 하지 않는 방향으로 코딩을 해야 한다는 점이다.
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
