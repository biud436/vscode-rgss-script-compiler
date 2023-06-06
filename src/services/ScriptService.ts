import { DataSourceFactory } from "../models/DataSourceFactory";
import { Script } from "../models/Script";

export class ScriptService {
    private _dataSource?: DataSourceFactory;

    constructor(workspaceRoot: string) {
        this._dataSource = new DataSourceFactory(workspaceRoot);
    }

    async create(scripts: Script[], isClear = true) {
        const dataSource = this._dataSource?.getDataSource();
        const scriptRepository = dataSource?.getTreeRepository(Script);

        if (!scriptRepository) {
            return;
        }

        if (isClear) {
            await scriptRepository.clear();
        }
        return await scriptRepository.save(scripts);
    }
}
