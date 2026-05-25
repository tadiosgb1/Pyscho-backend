'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `answers`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  13-answers: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('answers', [
      { option_id: 1,  user_id: 3, question_id: 1, submited_at: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { option_id: 5,  user_id: 3, question_id: 2, submited_at: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { option_id: 8,  user_id: 3, question_id: 3, submited_at: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { option_id: 13, user_id: 3, question_id: 4, submited_at: new Date(), createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('answers', null, {});
  }
};
