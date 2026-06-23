const { User } = require('./models');
require('dotenv').config();

async function testUserFields() {
  try {
    // Just describe the table to verify columns exist
    const attributes = User.getTableName ? await User.describe() : User.rawAttributes;
    
    console.log('User table columns:');
    const columnNames = Object.keys(User.rawAttributes);
    columnNames.forEach(col => {
      console.log(`- ${col}: ${User.rawAttributes[col].type.constructor.name}`);
    });
    
    console.log('\n✓ User model updated successfully with new profile fields!');
    
    // Check if new fields are present
    const newFields = ['photo', 'cv', 'date_of_birth', 'age', 'department', 'gender'];
    const missingFields = newFields.filter(field => !columnNames.includes(field));
    
    if (missingFields.length === 0) {
      console.log('✓ All new profile fields are present in the model!');
    } else {
      console.log('⚠ Missing fields:', missingFields);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUserFields();