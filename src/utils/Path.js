"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Path = void 0;
class PathImpl {
    constructor() {
        this.platform = process.platform;
    }
    resolve(url) {
        switch (this.platform) {
            case "win32":
                return url.fsPath;
            default:
            case "darwin":
                return url.path;
        }
    }
}
exports.Path = new PathImpl();
//# sourceMappingURL=Path.js.map