import { ScriptTree } from "./ScriptTree";
import { RGSSScriptSection as ScriptSection } from "./RGSSScriptSection";
import { TreeFileWatcher } from "./TreeFileWatcher";
import { ScriptService } from "../services/ScriptService";
import { ScriptExplorerProvider } from "./ScriptViewer";

export class DependencyProvider {
    constructor(
        public _tree: ScriptTree<ScriptSection>,
        public workspaceRoot: string,
        public scriptDirectory: string,
        public watcher: TreeFileWatcher,
        public scriptService: ScriptService,
        public view: ScriptExplorerProvider
    ) {}

    public set tree(tree: ScriptTree<ScriptSection>) {
        this.view.setTree(tree);
    }

    public get tree(): ScriptTree<ScriptSection> | undefined {
        return this.view.getTree();
    }
}
