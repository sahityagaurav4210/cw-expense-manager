import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.config';
import { User } from './User';

export interface DebtAttributes {
  id?: number;
  user_id: number;
  type: 'LENT' | 'BORROWED';
  person_name: string;
  contact_info?: string | null;
  initial_amount: number;
  settled_amount?: number;
  lent_date?: string;
  due_date?: string | null;
  status?: 'PENDING' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'WRITTEN_OFF';
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Debt extends Model<DebtAttributes> implements DebtAttributes {
  declare public id: number;
  declare public user_id: number;
  declare public type: 'LENT' | 'BORROWED';
  declare public person_name: string;
  declare public contact_info: string | null;
  declare public initial_amount: number;
  declare public settled_amount: number;
  declare public lent_date: string;
  declare public due_date: string | null;
  declare public status: 'PENDING' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'WRITTEN_OFF';
  declare public notes: string | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

Debt.init(
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
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'LENT',
    },
    person_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contact_info: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    initial_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    settled_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lent_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'debts',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

User.hasMany(Debt, { foreignKey: 'user_id' });
Debt.belongsTo(User, { foreignKey: 'user_id' });

export default Debt;
