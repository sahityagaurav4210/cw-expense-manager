import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.config';

export interface PaymentOptionsMasterAttributes {
  id?: number;
  payment_name: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class PaymentOptionsMaster
  extends Model<PaymentOptionsMasterAttributes>
  implements PaymentOptionsMasterAttributes
{
  declare public id: number;
  declare public payment_name: string;
  declare public is_active: boolean;
  declare public is_deleted: boolean;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

PaymentOptionsMaster.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payment_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'payment_options_master',
    schema: 'master',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
