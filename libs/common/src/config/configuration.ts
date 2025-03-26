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
  refresh_token_life: process.env.REFRESH_TOKEN_LIFE,
  redis: {
    port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
    host: process.env.REDIS_HOST || 'localhost',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  nodemailer: {
    email_password: process.env.EMAIL_PASSWORD,
    email_send: process.env.EMAIL_SEND,
  },
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  origin_fe_url: process.env.ORIGIN_FE_URL,
  default_user_logo: process.env.DEFAULT_LOGO_USER,
  payment_images: process.env.PAYMENT_IMAGES,
  payment_description: process.env.PAYMENT_DESCRIPTION,
  payment_title: process.env.PAYMENT_TITLE,
  payment_success_url: process.env.PAYMENT_SUCCESS_URL,
  payment_failed_url: process.env.PAYMENT_FAILED_URL,
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    callback_url: process.env.GOOGLE_CALLBACK_URL,
  },
  facebook: {
    client_id: process.env.FACEBOOK_CLIENT_ID,
    client_secret: process.env.FACEBOOK_CLIENT_SECRET,
    callback_url: process.env.FACEBOOK_CALLBACK_URL,
  },
  linkedin: {
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    callback_url: process.env.LINKEDIN_CALLBACK_URL,
  },
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
  },
  google_recaptcha: {
    site_key: process.env.GOOGLE_RECAPTCHA_SITE_KEY,
    secret_key: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
  },
  node_env: process.env.NODE_ENV,
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
});
