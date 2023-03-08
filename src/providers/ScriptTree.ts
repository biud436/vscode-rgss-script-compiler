type FilterPredicate<T> = (value: T, index: number, array: T[]) => boolean;

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
