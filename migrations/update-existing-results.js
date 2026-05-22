const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateExistingResults() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alpha_psycho'
  });

  try {
    console.log('Updating existing results to confirmed status...');
    
    const [result] = await connection.query(`
      UPDATE results 
      SET status = 'confirmed' 
      WHERE completed_at IS NOT NULL
    `);
    
    console.log(`Updated ${result.affectedRows} existing records to 'confirmed' status`);
    
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

updateExistingResults()
  .then(() => {
    console.log('Update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
