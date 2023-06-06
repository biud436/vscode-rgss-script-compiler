import { Repository, TreeRepository } from "typeorm";
import { DataSourceFactory } from "../models/DataSourceFactory";
import { Script } from "../models/Script";
import { ScriptExplorerProvider } from "../providers/ScriptViewer";

/**
 * @class ScriptService
 * @description This class allows you to interact with the Script entity.
 */
export class ScriptService {
    private _dataSource?: DataSourceFactory;
    private _scriptRepository: TreeRepository<Script>;
    private _treeProvider: ScriptExplorerProvider;

    /**
     * Creates an instance of ScriptService.
     *
     * @param workspaceRoot
     * @param provider
     */
    constructor(workspaceRoot: string, provider: ScriptExplorerProvider) {
        this._dataSource = new DataSourceFactory(workspaceRoot);
        this._scriptRepository = this._dataSource
            ?.getDataSource()
            ?.manager.getTreeRepository(Script);
        this._treeProvider = provider;
    }

    getRepository() {
        const dataSource = this._dataSource?.getDataSource();
        const treeRepository = dataSource?.getTreeRepository(Script);

        return treeRepository;
    }

    /**
     * Insert scripts into the database.
     *
     * @param scripts
     * @param isClear
     * @returns
     */
    async create(scripts: Script[], isClear = true) {
        if (isClear) {
            await this._scriptRepository?.clear();
        }
        return await this._scriptRepository?.save(scripts);
    }

    /**
     * Insert a new script into the database.
     *
     * @param scripts
     * @param isClear
     * @returns
     */
    async add(createScriptDto: Omit<Script, "id">) {
        const repository = this.getRepository();
        if (!repository) {
            return;
        }

        const item = repository.create(createScriptDto);

        return await repository?.save(item);
    }

    async findOneByUUID(uuid: string): Promise<Script | undefined> {
        const item = await this._scriptRepository.findOne({
            where: {
                uuid,
            },
        });

        return item!;
    }

    /**
     * Select all scripts from the database.
     *
     * @returns
     */
    async findAll(): Promise<Script[] | undefined> {
        const items = await this._scriptRepository?.findTrees();

        return items;
    }

    /**
     * Delete a script from the database.
     *
     * @param id
     * @returns
     */
    async delete(id: number) {
        const item = await this._scriptRepository.findOne({
            where: {
                id,
            },
        });

        if (!item) {
            return;
        }

        await this._scriptRepository.manager.remove(item);
    }

    async deleteByUUID(uuid: string) {
        const item = await this._scriptRepository.findOne({
            where: {
                uuid,
            },
        });

        if (!item) {
            return;
        }

        await this._scriptRepository.remove(item);
    }

    /**
     * Update a script from the database.
     *
     * @param id
     * @param updateScriptDto
     * @returns
     */
    async update(id: number, updateScriptDto: Partial<Script>) {
        const item = await this._scriptRepository.findOne({
            where: {
                id,
            },
        });

        if (!item) {
            return;
        }

        await this._scriptRepository.update(id, updateScriptDto);
    }

    async updateByUUID(uuid: string, updateScriptDto: Partial<Script>) {
        const item = await this._scriptRepository.findOne({
            where: {
                uuid,
            },
        });

        if (!item) {
            return;
        }

        await this._scriptRepository.update(item.id, updateScriptDto);
    }
}
