import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.config";
import { User } from "./User";
import { Category } from "./Category";

export interface ExpenseAttributes {
  id?: number;
  user_id: number;
  category_id?: number | null;
  name: string;
  amount: number;
  type: "Fixed" | "Variable";
  expense_date?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Expense extends Model<ExpenseAttributes> implements ExpenseAttributes {
  public declare id: number;
  public declare user_id: number;
  public declare category_id: number | null;
  public declare name: string;
  public declare amount: number;
  public declare type: "Fixed" | "Variable";
  public declare expense_date: string;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Category,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("Fixed", "Variable"),
      allowNull: false,
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "expenses",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

User.hasMany(Expense, { foreignKey: "user_id" });
Expense.belongsTo(User, { foreignKey: "user_id" });
Category.hasMany(Expense, { foreignKey: "category_id" });
Expense.belongsTo(Category, { foreignKey: "category_id" });
