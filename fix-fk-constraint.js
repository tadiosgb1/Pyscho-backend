/**
 * fix-fk-constraint.js
 *
 * Drops the erroneous foreign key constraint `test_assignments_ibfk_11`
 * on `assigned_to_id` in the `test_assignments` table.
 *
 * The `assigned_to_id` column is polymorphic — it holds either a user ID
 * or a group ID depending on `assigned_to_type`, so it must NOT have a
 * hard FK reference to the `users` table.
 *
 * Run once: node fix-fk-constraint.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./config/config')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

async function fix() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Check if the constraint exists before trying to drop it
    const [rows] = await sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = :db
        AND TABLE_NAME   = 'test_assignments'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME = 'test_assignments_ibfk_11'
    `, { replacements: { db: config.database } });

    if (rows.length === 0) {
      console.log('Constraint test_assignments_ibfk_11 does not exist — nothing to do.');
    } else {
      await sequelize.query(
        'ALTER TABLE `test_assignments` DROP FOREIGN KEY `test_assignments_ibfk_11`'
      );
      console.log('✅ Dropped foreign key constraint test_assignments_ibfk_11 successfully.');
    }

    // Also list remaining FK constraints on this table for verification
    const [remaining] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA    = :db
        AND TABLE_NAME      = 'test_assignments'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, { replacements: { db: config.database } });

    console.log('\nRemaining FK constraints on test_assignments:');
    if (remaining.length === 0) {
      console.log('  (none)');
    } else {
      remaining.forEach(r => {
        console.log(`  ${r.CONSTRAINT_NAME}: ${r.COLUMN_NAME} → ${r.REFERENCED_TABLE_NAME}.${r.REFERENCED_COLUMN_NAME}`);
      });
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fix();
