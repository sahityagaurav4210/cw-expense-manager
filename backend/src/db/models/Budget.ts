import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.config';
import { User } from './User';

export interface BudgetAttributes {
  id?: number;
  user_id: number;
  amount: number;
  from_date: string;
  to_date: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Budget extends Model<BudgetAttributes> implements BudgetAttributes {
  declare public id: number;
  declare public user_id: number;
  declare public amount: number;
  declare public from_date: string;
  declare public to_date: string;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

Budget.init(
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
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    from_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    to_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'budgets',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

User.hasMany(Budget, { foreignKey: 'user_id' });
Budget.belongsTo(User, { foreignKey: 'user_id' });
