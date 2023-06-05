import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "typeorm";

@Entity()
@Tree("materialized-path")
export class Script {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @TreeChildren()
    children!: Script[];

    @TreeParent()
    parent!: Script;

    @Column({
        nullable: true,
    })
    filePath?: string;
}
