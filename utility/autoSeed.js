'use strict';

/**
 * Auto-seeding utility
 * Runs seeders automatically on first server start
 * Tracks which seeders have been executed to avoid re-seeding
 */

const path = require('path');
const Sequelize = require('sequelize');

/**
 * Check if seeders have been run by checking if key tables have data
 * @param {Object} sequelize - Sequelize instance
 * @returns {Promise<boolean>} - true if already seeded, false otherwise
 */
async function isAlreadySeeded(sequelize) {
  try {
    // Check if organizations table exists and has data
    const [results] = await sequelize.query(
      "SELECT COUNT(*) as count FROM organizations LIMIT 1"
    );
    
    const count = results[0].count;
    return count > 0;
  } catch (error) {
    // Table doesn't exist or query failed - not seeded
    return false;
  }
}

/**
 * Run all seeders in order
 * @param {Object} sequelize - Sequelize instance
 */
async function runSeeders(sequelize) {
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

  console.log('\n🌱 Running initial database seeders...\n');

  // Load and run each seeder
  for (const seederName of seeders) {
    try {
      const seeder = require(path.join(__dirname, '..', 'seeders', `${seederName}.js`));
      await seeder.up(queryInterface, Sequelize);
      console.log(`  ✓ Seeded: ${seederName}`);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${seederName}:`, error.message);
      throw error;
    }
  }

  console.log('\n✅ All seeders completed successfully.\n');
}

/**
 * Main auto-seed function
 * Checks if seeding is needed and runs seeders if necessary
 * @param {Object} sequelize - Sequelize instance
 */
async function autoSeed(sequelize) {
  try {
    const alreadySeeded = await isAlreadySeeded(sequelize);
    
    if (alreadySeeded) {
      console.log('ℹ️  Database already seeded. Skipping auto-seed.');
      return;
    }
    
    console.log('📦 Database is empty. Running seeders...');
    await runSeeders(sequelize);
    
  } catch (error) {
    console.error('❌ Auto-seeding failed:', error.message);
    console.error('You can manually run seeders using: npm run seed');
    // Don't throw - allow server to start even if seeding fails
  }
}

module.exports = autoSeed;
