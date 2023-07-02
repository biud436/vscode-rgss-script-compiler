export function checkMigrationNeeded(lines: string[]): boolean {
    const isLineStartsWithNumber = lines.every((line) => {
        return line.match(/^[\d]{3}[\.]*[\d]*\-/);
    });

    return !isLineStartsWithNumber;
}
