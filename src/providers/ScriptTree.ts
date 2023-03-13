import { RGSSScriptSection } from "./RGSSScriptSection";

type FilterPredicate<T> = (value: T, index: number, array: T[]) => boolean;

export class ScriptTree<T extends RGSSScriptSection> {
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

    public replaceTree(id: string | undefined, newItem: T): ScriptTree<T> {
        const index = this.findIndex((item) => item.id === id);
        return this.splice(index, 1, newItem);
    }

    get length(): number {
        return this.data.length;
    }

    /**
     * for ... of
     * @returns
     */
    public [Symbol.iterator](): Iterator<T> {
        return this.data[Symbol.iterator]();
    }

    public getChildren(): T[] {
        return this.data;
    }
}
