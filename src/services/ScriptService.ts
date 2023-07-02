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

    private getRepository() {
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
    public async create(scripts: Script[], isClear = true) {
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
    public async add(createScriptDto: Omit<Script, "id">) {
        const item = this._scriptRepository?.create(createScriptDto);

        return await this._scriptRepository?.save(item);
    }

    public async findOneByUUID(uuid: string): Promise<Script | undefined> {
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
    public async findAll(): Promise<Script[] | undefined> {
        const items = await this._scriptRepository?.findTrees();

        return items;
    }

    /**
     * Delete a script from the database.
     *
     * @param id
     * @returns
     */
    public async delete(id: number) {
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

    public async deleteByUUID(uuid: string) {
        if (!uuid) {
            console.warn("uuid is the undefined or null");
            return;
        }

        if (uuid === "") {
            console.warn("uuid is empty");
            return;
        }

        const item = await this._scriptRepository.findOne({
            where: {
                uuid,
            },
        });

        if (!item) {
            // throw new Error("can't find the script item");
        }

        if (item) {
            await this._scriptRepository.remove(item);
        }
    }

    /**
     * Update a script from the database.
     *
     * @param id
     * @param updateScriptDto
     * @returns
     */
    public async update(id: number, updateScriptDto: Partial<Script>) {
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

    public async updateByUUID(uuid: string, updateScriptDto: Partial<Script>) {
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
