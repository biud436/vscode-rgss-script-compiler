import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "typeorm";
import { generateUUID } from "../utils/uuid";

@Entity()
@Tree("materialized-path")
export class Script {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        unique: true,
    })
    uuid!: string;

    @Column()
    title!: string;

    @TreeChildren()
    children!: Script[];

    @TreeParent()
    parent!: Script;

    @Column()
    filePath: string;

    /**
     *
     * @param title
     * @param filePath
     */
    constructor(title = "", filePath = generateUUID().replace(/-/g, "")) {
        this.title = title;
        this.filePath = filePath;
    }
}
