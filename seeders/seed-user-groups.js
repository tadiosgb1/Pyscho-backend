'use strict';

require('dotenv').config();
const db     = require('../models');
const seeder = require('./19-user-groups');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connected.\n');

    await db.sequelize.sync({ alter: true });
    console.log('Tables synced.\n');

    const qi        = db.sequelize.getQueryInterface();
    const Sequelize = db.Sequelize;

    await seeder.down(qi, Sequelize);
    console.log('↓ Cleared: user_groups');

    await seeder.up(qi, Sequelize);
    console.log('✓ Seeded: user_groups');

    console.log('\nDone.');
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
})();
