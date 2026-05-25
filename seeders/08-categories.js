'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `categories`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  08-categories: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('categories', [
      { name: 'Extraversion vs Introversion', description: 'Measures how a person gains energy — from others or from within.', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Sensing vs Intuition',         description: 'Measures how a person perceives information.',                    createdAt: new Date(), updatedAt: new Date() },
      { name: 'Thinking vs Feeling',          description: 'Measures how a person makes decisions.',                          createdAt: new Date(), updatedAt: new Date() },
      { name: 'Judging vs Perceiving',        description: 'Measures how a person approaches structure and planning.',        createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
