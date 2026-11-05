import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.config';
import { User } from './User';
import { Budget } from './Budget';

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
  declare public id: number;
  declare public budget_id: number;
  declare public user_id: number;
  declare public amount: number;
  declare public source: string;
  declare public received_date: string;
  declare public notes: string | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
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
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
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
    tableName: 'budget_inflows',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

Budget.hasMany(BudgetInflow, { foreignKey: 'budget_id', as: 'inflows' });
BudgetInflow.belongsTo(Budget, { foreignKey: 'budget_id' });

User.hasMany(BudgetInflow, { foreignKey: 'user_id' });
BudgetInflow.belongsTo(User, { foreignKey: 'user_id' });

export default BudgetInflow;
