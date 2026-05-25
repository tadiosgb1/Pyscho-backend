'use strict';

/**
 * Auto-seeding utility
 *
 * Each seeder file is responsible for its own idempotency check —
 * it queries its target table and skips if rows already exist.
 * This means autoSeed can safely be called on every server start
 * without risk of duplicate data.
 *
 * Table-name casing used in seeders (matches actual MySQL table names):
 *   Users, Roles, Permissions, RolePermissions, UserRoles, UserPermissions
 *   organizations, categories, triats, tests, questions, options
 *   answers, results, progresses, groups, contacts, faks
 *   user_groups, test_assignments, plans, subscriptions, invoices
 */

const path      = require('path');
const Sequelize = require('sequelize');

const SEEDERS = [
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
  '23-invoices',
];

/**
 * Run all seeders in order.
 * Each seeder skips itself if its table already has rows.
 */
async function runSeeders(sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  console.log('\n🌱 Running database seeders...\n');

  for (const name of SEEDERS) {
    try {
      const seeder = require(path.join(__dirname, '..', 'seeders', `${name}.js`));
      await seeder.up(queryInterface, Sequelize);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      // Continue to next seeder — don't abort the whole run
    }
  }

  console.log('\n✅ Seeder run complete.\n');
}

/**
 * Entry point called from server.js after db.sequelize.sync().
 * Always runs all seeders; each one decides internally whether to skip.
 */
async function autoSeed(sequelize) {
  try {
    await runSeeders(sequelize);
  } catch (err) {
    console.error('❌ autoSeed unexpected error:', err.message);
    // Never crash the server over seeding
  }
}

module.exports = autoSeed;
