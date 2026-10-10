import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.config";

export interface CategoryAttributes {
  id?: number;
  name: string;
  active_flag: boolean;
  delete_flag: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Category extends Model<CategoryAttributes> implements CategoryAttributes {
  public declare id: number;
  public declare name: string;
  public declare active_flag: boolean;
  public declare delete_flag: boolean;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    active_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    delete_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "categories",
    schema: "master",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
