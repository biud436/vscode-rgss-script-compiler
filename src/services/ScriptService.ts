import { DataSourceFactory } from "../models/DataSourceFactory";
import { Script } from "../models/Script";

export class ScriptService {
    private _dataSource?: DataSourceFactory;

    constructor(workspaceRoot: string) {
        this._dataSource = new DataSourceFactory(workspaceRoot);
    }

    getRepository() {
        const dataSource = this._dataSource?.getDataSource();
        const scriptRepository = dataSource?.manager.getTreeRepository(Script);

        return scriptRepository;
    }

    async create(scripts: Script[], isClear = true) {
        const scriptRepository = this.getRepository();

        if (!scriptRepository) {
            return;
        }

        if (isClear) {
            await scriptRepository.clear();
        }
        return await scriptRepository.save(scripts);
    }

    async findAll(): Promise<Script[] | undefined> {
        const repository = this.getRepository();
        if (!repository) {
            return;
        }

        const items = await repository?.findTrees();

        return items;
    }

    async delete(id: number) {
        const repository = this.getRepository();

        if (!repository) {
            return;
        }

        const item = await repository.findOne({
            where: {
                id,
            },
        });

        if (!item) {
            return;
        }

        await repository.remove(item);
    }

    async update(id: number, updateScriptDto: Partial<Script>) {
        const repository = this.getRepository();

        if (!repository) {
            return;
        }

        const item = await repository.findOne({
            where: {
                id,
            },
        });

        if (!item) {
            return;
        }

        await repository.update(id, updateScriptDto);
    }
}
