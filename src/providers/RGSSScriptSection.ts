import * as vscode from "vscode";

/**
 * @class RGSSScriptSection
 */
export class RGSSScriptSection extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly filePath: string
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = `${this.label}`;
    }
}
