import { DependencyProvider } from "../providers/DependencyProvider";
import { RGSSScriptSection as ScriptSection } from "../providers/RGSSScriptSection";
import { ScriptTree } from "../providers/ScriptTree";
import * as path from "path";
import { Path } from "../utils/Path";

export class MenuCommand {
    constructor(protected dependencyProvider: DependencyProvider) {}

    protected get view() {
        return this.dependencyProvider.view;
    }

    protected get tree() {
        return this.dependencyProvider.tree!;
    }

    protected set tree(tree: ScriptTree<ScriptSection>) {
        this.dependencyProvider.tree = tree;
    }

    protected get watcher() {
        return this.dependencyProvider.watcher;
    }

    protected get workspaceRoot() {
        return this.dependencyProvider.workspaceRoot;
    }

    protected get scriptDirectory() {
        return this.dependencyProvider.scriptDirectory;
    }

    /**
     * Get the file path of the item.
     *
     * @param item
     * @returns
     */
    getItemFilePath(item: ScriptSection) {
        return path.posix.join(
            this.workspaceRoot,
            this.scriptDirectory,
            Path.getFileName(item.filePath)
        );
    }
}
