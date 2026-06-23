const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  }
);

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Import and run the migration
    const migration = require('./migrations/add-user-profile-fields.js');
    await migration.up(queryInterface, Sequelize);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();