import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { ScriptSection } from "./ScriptSection";

export class DataSourceFactory {
    private static instance: DataSourceFactory;

    private options: DataSourceOptions = {
        type: "sqlite",
        database: "db.sqlite",
        synchronize: true,
        namingStrategy: new SnakeNamingStrategy(),
        entities: [ScriptSection],
    };

    private dataSource = new DataSource(this.options);

    private constructor() {}

    public static getInstance(): DataSourceFactory {
        if (!DataSourceFactory.instance) {
            DataSourceFactory.instance = new DataSourceFactory();
        }

        return DataSourceFactory.instance;
    }

    public async initialize(): Promise<void> {
        try {
            await this.dataSource.initialize();
        } catch (error: any) {
            console.warn(error);
        }
    }

    public getDataSource(): DataSource {
        return this.dataSource;
    }
}
