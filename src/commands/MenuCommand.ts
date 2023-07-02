import { DependencyProvider } from "../providers/DependencyProvider";
import { RGSSScriptSection as ScriptSection } from "../providers/RGSSScriptSection";
import { ScriptTree } from "../providers/ScriptTree";

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

    protected get scriptService() {
        return this.dependencyProvider.scriptService;
    }

    protected get workspaceRoot() {
        return this.dependencyProvider.workspaceRoot;
    }

    protected get scriptDirectory() {
        return this.dependencyProvider.scriptDirectory;
    }
}
