'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('tests', [
      {
        title: 'MBTI Personality Assessment',
        description: 'A comprehensive personality test based on Myers-Briggs Type Indicator.',
        duration: '30 minutes',
        created_by: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Emotional Intelligence Test',
        description: 'Measures your ability to identify and manage emotions.',
        duration: '20 minutes',
        created_by: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tests', null, {});
  }
};
