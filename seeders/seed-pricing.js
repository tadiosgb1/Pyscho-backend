'use strict';

require('dotenv').config();
const db = require('../models'); // use the full app models so sync creates tables

const s21 = require('./21-plans');
const s22 = require('./22-subscriptions');
const s23 = require('./23-invoices');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connected.\n');

    // Sync all models so tables exist before seeding
    await db.sequelize.sync({ alter: true });
    console.log('Tables synced.\n');

    const qi = db.sequelize.getQueryInterface();
    const Sequelize = db.Sequelize;

    // Clear in reverse order (FK constraints)
    await s23.down(qi, Sequelize); console.log('↓ Cleared: invoices');
    await s22.down(qi, Sequelize); console.log('↓ Cleared: subscriptions');
    await s21.down(qi, Sequelize); console.log('↓ Cleared: plans');
    console.log('');

    // Re-seed in order
    await s21.up(qi, Sequelize); console.log('✓ Seeded: plans');
    await s22.up(qi, Sequelize); console.log('✓ Seeded: subscriptions');
    await s23.up(qi, Sequelize); console.log('✓ Seeded: invoices');

    console.log('\nDone.');
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
})();
