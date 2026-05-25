'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `tests`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  10-tests: already seeded, skipping.');
      return;
    }

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
