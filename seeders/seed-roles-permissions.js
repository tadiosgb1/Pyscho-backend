'use strict';

require('dotenv').config();
const db = require('../models');

const s03 = require('./03-roles');
const s04 = require('./04-permissions');
const s05 = require('./05-role-permissions');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connected.\n');

    await db.sequelize.sync({ alter: true });
    console.log('Tables synced.\n');

    const qi        = db.sequelize.getQueryInterface();
    const Sequelize = db.Sequelize;

    // Clear in reverse order (FK constraints)
    await s05.down(qi, Sequelize); console.log('↓ Cleared: role-permissions');
    await s04.down(qi, Sequelize); console.log('↓ Cleared: permissions');
    await s03.down(qi, Sequelize); console.log('↓ Cleared: roles');
    console.log('');

    // Re-seed in order
    await s03.up(qi, Sequelize); console.log('✓ Seeded: roles');
    await s04.up(qi, Sequelize); console.log('✓ Seeded: permissions');
    await s05.up(qi, Sequelize); console.log('✓ Seeded: role-permissions');

    console.log('\nDone.');
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
})();
