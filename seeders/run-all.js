'use strict';

/**
 * Run all seeders in order.
 * Usage: node seeders/run-all.js
 *        npm run seed
 */

const path = require('path');
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

require('dotenv').config();

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false
});

const queryInterface = sequelize.getQueryInterface();

const seeders = [
  '01-organizations',
  '02-users',
  '03-roles',
  '04-permissions',
  '05-role-permissions',
  '06-user-roles',
  '07-user-permissions',
  '08-categories',
  '09-triats',
  '10-tests',
  '11-questions',
  '12-options',
  '13-answers',
  '14-results',
  '15-progresses',
  '16-groups',
  '17-contacts',
  '18-faqs',
  '19-user-groups',
  '20-test-assignments',
  '21-plans',
  '22-subscriptions',
  '23-invoices'
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.\n');

    // Load all seeder modules first
    const loaded = seeders.map(name => ({
      name,
      seeder: require(path.join(__dirname, `${name}.js`))
    }));

    // Run DOWN in reverse order to cleanly wipe existing data
    console.log('Clearing existing seed data...');
    for (const { name, seeder } of [...loaded].reverse()) {
      try {
        await seeder.down(queryInterface, Sequelize);
        console.log(`  ↓ Cleared: ${name}`);
      } catch (e) {
        // Table may not exist yet on first run — safe to ignore
        console.log(`  ↓ Skipped (not found): ${name}`);
      }
    }

    console.log('');

    // Run UP in order
    for (const { name, seeder } of loaded) {
      await seeder.up(queryInterface, Sequelize);
      console.log(`✓ Seeded: ${name}`);
    }

    console.log('\nAll seeders completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
