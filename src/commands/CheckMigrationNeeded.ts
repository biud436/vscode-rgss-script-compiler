/**
 * Check the extension version (0.0.16 -> 0.1.0)
 * @param lines
 * @returns
 */
export function checkMigrationNeeded(lines: string[]): boolean {
    const isLineStartsWithNumber = lines.every((line) => {
        return line.match(/^[\d]{3}[\.]*[\d]*\-/);
    });

    return !isLineStartsWithNumber;
}
