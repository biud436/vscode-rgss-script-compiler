export class ScriptStore {
    usedSections: number[] = [];

    getRandomSection(): Readonly<number> {
        let section: number;
        do {
            section = Math.floor(Math.random() * 2147483647);
        } while (this.usedSections.includes(section));
        this.usedSections.push(section);
        return section;
    }
}
