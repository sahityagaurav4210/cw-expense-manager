import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.config';
import { User } from './User';
import { Category } from './Category';

export interface ExpenseAttributes {
  id?: number;
  user_id: number;
  category_id?: number | null;
  name: string;
  amount: number;
  type: 'Fixed' | 'Variable';
  expense_date?: string;
  bill_url?: string | null;
  bill_original_name?: string | null;
  bill_mime_type?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Expense extends Model<ExpenseAttributes> implements ExpenseAttributes {
  declare public id: number;
  declare public user_id: number;
  declare public category_id: number | null;
  declare public name: string;
  declare public amount: number;
  declare public type: 'Fixed' | 'Variable';
  declare public expense_date: string;
  declare public bill_url: string | null;
  declare public bill_original_name: string | null;
  declare public bill_mime_type: string | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
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
        key: 'id',
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Category,
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Fixed', 'Variable'),
      allowNull: false,
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    bill_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bill_original_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bill_mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'expenses',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

User.hasMany(Expense, { foreignKey: 'user_id' });
Expense.belongsTo(User, { foreignKey: 'user_id' });
Category.hasMany(Expense, { foreignKey: 'category_id' });
Expense.belongsTo(Category, { foreignKey: 'category_id' });
