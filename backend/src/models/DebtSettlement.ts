import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.config";
import { User } from "./User";
import { Debt } from "./Debt";

export interface DebtSettlementAttributes {
  id?: number;
  debt_id: number;
  user_id: number;
  amount: number;
  settlement_date?: string;
  payment_mode?: string;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class DebtSettlement
  extends Model<DebtSettlementAttributes>
  implements DebtSettlementAttributes
{
  public declare id: number;
  public declare debt_id: number;
  public declare user_id: number;
  public declare amount: number;
  public declare settlement_date: string;
  public declare payment_mode: string;
  public declare notes: string | null;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

DebtSettlement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    debt_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Debt,
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
    settlement_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    payment_mode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "UPI",
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "debt_settlements",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Debt.hasMany(DebtSettlement, { foreignKey: "debt_id", as: "settlements" });
DebtSettlement.belongsTo(Debt, { foreignKey: "debt_id" });

User.hasMany(DebtSettlement, { foreignKey: "user_id" });
DebtSettlement.belongsTo(User, { foreignKey: "user_id" });

export default DebtSettlement;
