'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `questions`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  11-questions: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('questions', [
      { question_text: 'Do you feel energized after spending time with a large group of people?',  category_id: 1, type: 'multiple', test_id: 1, createdAt: new Date(), updatedAt: new Date() },
      { question_text: 'Do you prefer to focus on the present moment rather than future possibilities?', category_id: 2, type: 'multiple', test_id: 1, createdAt: new Date(), updatedAt: new Date() },
      { question_text: 'When making a decision, do you rely more on logic than personal feelings?', category_id: 3, type: 'likert',   test_id: 1, createdAt: new Date(), updatedAt: new Date() },
      { question_text: 'Do you prefer to have a detailed plan before starting a project?',          category_id: 4, type: 'multiple', test_id: 1, createdAt: new Date(), updatedAt: new Date() },
      { question_text: 'How well do you recognize emotions in others?',                             category_id: 1, type: 'likert',   test_id: 2, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('questions', null, {});
  }
};
