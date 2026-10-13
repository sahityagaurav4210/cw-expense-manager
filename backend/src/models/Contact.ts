import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.config";
import { User } from "./User";

export interface ContactAttributes {
  id?: number;
  user_id: number;
  name: string;
  phone: string;
  email?: string | null;
  profile_photo?: string | null;
  company?: string | null;
  job_title?: string | null;
  category?: string;
  address?: string | null;
  notes?: string | null;
  is_favorite?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Contact extends Model<ContactAttributes> implements ContactAttributes {
  public declare id: number;
  public declare user_id: number;
  public declare name: string;
  public declare phone: string;
  public declare email: string | null;
  public declare profile_photo: string | null;
  public declare company: string | null;
  public declare job_title: string | null;
  public declare category: string;
  public declare address: string | null;
  public declare notes: string | null;
  public declare is_favorite: boolean;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Contact.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    profile_photo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    job_title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Other",
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_favorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "contacts",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

User.hasMany(Contact, { foreignKey: "user_id" });
Contact.belongsTo(User, { foreignKey: "user_id" });

export default Contact;
