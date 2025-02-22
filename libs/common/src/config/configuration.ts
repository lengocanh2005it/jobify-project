export default () => ({
  port: parseInt(process.env.PORT as string, 10) || 3001,
  database: {
    port: parseInt(process.env.DB_PORT as string, 10) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
  },
});
