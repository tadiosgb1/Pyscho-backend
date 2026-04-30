'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('groups', [
      {
        name: 'Research Team A',
        description: 'Primary research group for personality studies.',
        organization: 'Alpha Psycho Institute',
        _id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Clinical Group B',
        description: 'Clinical assessment group.',
        organization: 'Mind & Wellness Center',
        _id: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('groups', null, {});
  }
};
