export class FileIndexTransformer {
    public static transform(currentIndex: string) {
        if (/[\d]+\.[\d]+/g.exec(currentIndex)) {
            const [primary, secondary] = currentIndex.split(".");
            const isAllNumeric = [primary, secondary].every((e) =>
                /[\d]+/g.exec(e),
            );

            if (!isAllNumeric) {
                const newFileRule = 1000 + Math.floor(Math.random() * 500);
                return newFileRule + "-";
            }

            const newFileRule = primary + "." + (parseInt(secondary) + 1);

            return newFileRule + "-";
        }

        const subPrefix = `${currentIndex}.${Math.floor(
            Math.random() * 1000,
        )}-`;

        return subPrefix;
    }
}
