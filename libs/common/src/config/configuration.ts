export default () => ({
  port: parseInt(process.env.PORT as string, 10) || 3001,
  database: {
    port: parseInt(process.env.DB_PORT as string, 10) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
  },
  jwt_secret_key: process.env.JWT_SECRET_KEY,
  access_token_life: process.env.ACCESS_TOKEN_LIFE,
  redis: {
    port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
    host: process.env.REDIS_HOST || 'localhost',
  },
});
