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
export class ScriptSection {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @TreeChildren()
    children!: ScriptSection[];

    @TreeParent()
    parent!: ScriptSection;

    @Column({
        nullable: true,
    })
    filePath?: string;
}
