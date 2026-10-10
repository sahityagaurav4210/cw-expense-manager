import { Sequelize } from "sequelize";
import { logger } from "./logger.config";

/**
 * Singleton DatabaseConfig class managing PostgreSQL connection via Sequelize.
 */
export class DatabaseConfig {
  private static instance: Sequelize;

  private constructor() {}

  public static getInstance(): Sequelize {
    if (!DatabaseConfig.instance) {
      const dbName = process.env.DB_NAME || "cw-expense-tracker";
      const dbUser = process.env.DB_USER || "postgres";
      const dbHost = process.env.DB_HOST || "localhost";
      const dbPort = parseInt(process.env.DB_PORT || "5432", 10);
      const dbPassword = process.env.DB_PASSWORD || "root";

      DatabaseConfig.instance = new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: "postgres",
        logging: (msg) => logger.debug(msg),
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
        },
      });
    }

    return DatabaseConfig.instance;
  }
}

export const sequelize = DatabaseConfig.getInstance();
