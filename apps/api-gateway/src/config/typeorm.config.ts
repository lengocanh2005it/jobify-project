import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const AppDataSource = new DataSource({
  type: 'mysql',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 3306,
  host: process.env.DB_HOST || 'localhost',
  entities: ['dist/**/*.entity.js'],
  synchronize: false,
  logging: false,
});

export default AppDataSource;
