'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('progresses', [
      {
        score: 85,
        user_id: 3,
        test_id: 1,
        taken_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        score: 72,
        user_id: 2,
        test_id: 1,
        taken_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('progresses', null, {});
  }
};
