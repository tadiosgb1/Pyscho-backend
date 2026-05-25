'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `progresses`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  15-progresses: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('progresses', [
      { score: 85, user_id: 3, test_id: 1, taken_at: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { score: 72, user_id: 2, test_id: 1, taken_at: new Date(), createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('progresses', null, {});
  }
};
