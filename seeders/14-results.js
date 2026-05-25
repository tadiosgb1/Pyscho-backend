'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `results`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  14-results: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('results', [
      {
        score: 85,
        interpretation: 'ENFJ - The Protagonist',
        recommendations: 'You are a natural leader. Consider roles in counseling, teaching, or management.',
        status: 'confirmed',
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
        status: 'pending',
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
