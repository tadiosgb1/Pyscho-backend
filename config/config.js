require('dotenv').config(); // load environment variables from .env

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_DATABASE || 'alpha_psycho',
    host: process.env.DB_HOST || 'mysql',   // IMPORTANT: service name in docker-compose
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  },

  test: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_DATABASE || 'alpha_psycho',
    host: process.env.DB_HOST || 'mysql',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  },

  production: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || 'alpha_psycho',
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  },
};
