import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.config";
import { User } from "./User";
import { Budget } from "./Budget";

export interface BudgetInflowAttributes {
  id?: number;
  budget_id: number;
  user_id: number;
  amount: number;
  source: string;
  received_date?: string;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class BudgetInflow extends Model<BudgetInflowAttributes> implements BudgetInflowAttributes {
  public declare id: number;
  public declare budget_id: number;
  public declare user_id: number;
  public declare amount: number;
  public declare source: string;
  public declare received_date: string;
  public declare notes: string | null;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

BudgetInflow.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    budget_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Budget,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    received_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "budget_inflows",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Budget.hasMany(BudgetInflow, { foreignKey: "budget_id", as: "inflows" });
BudgetInflow.belongsTo(Budget, { foreignKey: "budget_id" });

User.hasMany(BudgetInflow, { foreignKey: "user_id" });
BudgetInflow.belongsTo(User, { foreignKey: "user_id" });

export default BudgetInflow;
