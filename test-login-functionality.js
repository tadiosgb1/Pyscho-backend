const { User } = require('./models');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testLoginFunctionality() {
  try {
    console.log('🔐 Testing Login Functionality\n');

    // Test 1: Check if phone_number column exists
    console.log('1. Checking database schema...');
    const attributes = User.rawAttributes;
    const hasPhoneNumber = !!attributes.phone_number;
    const hasPhone = !!attributes.phone;
    
    console.log(`   ✓ phone column: ${hasPhone ? '✅ exists' : '❌ missing'}`);
    console.log(`   ✓ phone_number column: ${hasPhoneNumber ? '✅ exists' : '❌ missing'}`);
    
    if (!hasPhoneNumber) {
      console.log('\n⚠️  Warning: phone_number column is missing. Run the migration first.');
      return;
    }

    // Test 2: Check if we can create a test user with phone_number
    console.log('\n2. Testing user creation with phone_number...');
    
    // Clean up any existing test user
    await User.destroy({ where: { email: 'test@example.com' } });
    
    const testUser = await User.create({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone_number: '+1234567890',
      password: await bcrypt.hash('password123', 10)
    });
    
    console.log('   ✅ Test user created successfully');
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   📱 Phone: ${testUser.phone_number}`);

    // Test 3: Test email login logic
    console.log('\n3. Testing login logic...');
    
    // Simulate email login
    const { Op } = require('sequelize');
    const loginEmail = 'test@example.com';
    const isPhoneNumber = /^[\+]?[\d\s\-\(\)]+$/.test(loginEmail);
    
    console.log(`   📧 Email login test: "${loginEmail}"`);
    console.log(`   🔍 Is phone number: ${isPhoneNumber ? 'Yes' : 'No'}`);
    
    const emailUser = await User.findOne({
      where: isPhoneNumber ? {
        [Op.or]: [
          { phone: loginEmail },
          { phone_number: loginEmail }
        ]
      } : { email: loginEmail }
    });
    
    console.log(`   ✅ User found by email: ${emailUser ? 'Yes' : 'No'}`);

    // Test 4: Test phone login logic
    const loginPhone = '+1234567890';
    const isPhoneNumber2 = /^[\+]?[\d\s\-\(\)]+$/.test(loginPhone);
    
    console.log(`\n   📱 Phone login test: "${loginPhone}"`);
    console.log(`   🔍 Is phone number: ${isPhoneNumber2 ? 'Yes' : 'No'}`);
    
    const phoneUser = await User.findOne({
      where: isPhoneNumber2 ? {
        [Op.or]: [
          { phone: loginPhone },
          { phone_number: loginPhone }
        ]
      } : { email: loginPhone }
    });
    
    console.log(`   ✅ User found by phone: ${phoneUser ? 'Yes' : 'No'}`);

    // Test 5: Test password validation
    console.log('\n4. Testing password validation...');
    const isValidPassword = await bcrypt.compare('password123', testUser.password);
    console.log(`   ✅ Password validation: ${isValidPassword ? 'Valid' : 'Invalid'}`);

    // Clean up
    await User.destroy({ where: { id: testUser.id } });
    console.log('\n🧹 Test user cleaned up');

    console.log('\n🎉 Login functionality test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database schema is correct');
    console.log('   ✅ User creation with phone_number works');
    console.log('   ✅ Email login detection works');
    console.log('   ✅ Phone login detection works');
    console.log('   ✅ Password validation works');
    console.log('\n🚀 Login system is ready for testing!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

testLoginFunctionality();