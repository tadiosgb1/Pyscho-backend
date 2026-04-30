'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('results', [
      {
        score: 85,
        interpretation: 'ENFJ - The Protagonist',
        recommendations: 'You are a natural leader. Consider roles in counseling, teaching, or management.',
        user_id: 3,
        test_id: 1,
        completed_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        score: 72,
        interpretation: 'INTJ - The Architect',
        recommendations: 'You are strategic and independent. Consider roles in engineering, science, or research.',
        user_id: 2,
        test_id: 1,
        completed_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('results', null, {});
  }
};
