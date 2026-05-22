const mysql = require('mysql2/promise');
require('dotenv').config();

async function addStatusColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alpha_psycho'
  });

  try {
    console.log('Adding status column to results table...');
    
    // Check if column already exists
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM results LIKE 'status'"
    );
    
    if (columns.length > 0) {
      console.log('Status column already exists!');
      return;
    }
    
    // Add status column
    await connection.query(`
      ALTER TABLE results 
      ADD COLUMN status ENUM('pending', 'confirmed') DEFAULT 'pending' 
      AFTER recommendations
    `);
    
    console.log('Status column added successfully!');
    
    // Update existing records to 'confirmed' (since they were already completed)
    const [result] = await connection.query(`
      UPDATE results 
      SET status = 'confirmed' 
      WHERE status IS NULL
    `);
    
    console.log(`Updated ${result.affectedRows} existing records to 'confirmed' status`);
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
addStatusColumn()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
