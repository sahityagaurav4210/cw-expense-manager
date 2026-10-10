import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.config";

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  phone_no?: string;
  password?: string;
  employment_type: "Salaried" | "Self-Employed";
  profile_photo_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public declare id: number;
  public declare name: string;
  public declare email: string;
  public declare phone_no: string;
  public declare password: string;
  public declare employment_type: "Salaried" | "Self-Employed";
  public declare profile_photo_url: string;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
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
      type: DataTypes.ENUM("Salaried", "Self-Employed"),
      allowNull: false,
    },
    profile_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
