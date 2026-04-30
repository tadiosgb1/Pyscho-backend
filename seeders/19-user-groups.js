'use strict';

// Users seeded: 1 = Admin, 2 = Tadesse, 3 = Sara
// Groups seeded: 1 = Research Team A, 2 = Clinical Group B

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_groups', [
      // Admin belongs to both groups
      {
        userId: 1,
        groupId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 1,
        groupId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Tadesse belongs to Research Team A
      {
        userId: 2,
        groupId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Sara belongs to Clinical Group B
      {
        userId: 3,
        groupId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_groups', null, {});
  }
};
