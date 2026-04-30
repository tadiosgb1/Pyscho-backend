'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Roles', [
      {
        name: 'admin',
        description: 'System owner — full access to everything',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'organization',
        description: 'Organization admin — manages their own members and views results',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'tester',
        description: 'Individual tester — can take tests and view own results',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
