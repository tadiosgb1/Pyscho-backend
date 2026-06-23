'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `Users`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  02-users: already seeded, skipping.');
      return;
    }

    const hash = await bcrypt.hash('1234', 10);
    await queryInterface.bulkInsert('Users', [
      {
        first_name: 'Admin',
        middle_name: 'Super',
        last_name: 'User',
        phone: '+251911000010',
        email: 'super@gmail.com',
        password: hash,
        organization_id: 1,
        created_by: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        first_name: 'Tadesse',
        middle_name: 'Bekele',
        last_name: 'Alemu',
        phone: '+251911000011',
        email: 'org@gmail.com',
        password: hash,
        organization_id: 1,
        created_by: 1,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        first_name: 'Sara',
        middle_name: 'Haile',
        last_name: 'Tesfaye',
        phone: '+251911000012',
        email: 'tester@gmail.com',
        password: hash,
        organization_id: 2,
        created_by: 1,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
