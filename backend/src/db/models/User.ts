import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.config';

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  phone_no?: string;
  password?: string;
  employment_type: 'Salaried' | 'Self-Employed';
  annual_income?: number | null;
  profile_photo_url?: string;
  two_factor_method?: 'EMAIL' | 'AUTHENTICATOR';
  authenticator_secret?: string;
  is_authenticator_enabled?: boolean;
  is_terms_accepted?: boolean;
  isTermsAccepted?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  declare public id: number;
  declare public name: string;
  declare public email: string;
  declare public phone_no: string;
  declare public password: string;
  declare public employment_type: 'Salaried' | 'Self-Employed';
  declare public annual_income: number | null;
  declare public profile_photo_url: string;
  declare public two_factor_method: 'EMAIL' | 'AUTHENTICATOR';
  declare public authenticator_secret: string;
  declare public is_authenticator_enabled: boolean;
  declare public is_terms_accepted: boolean;
  declare public isTermsAccepted: boolean;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    phone_no: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    employment_type: {
      type: DataTypes.ENUM('Salaried', 'Self-Employed'),
      allowNull: false,
    },
    annual_income: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: null,
    },
    profile_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    two_factor_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'EMAIL',
    },
    authenticator_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_authenticator_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_terms_accepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isTermsAccepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
