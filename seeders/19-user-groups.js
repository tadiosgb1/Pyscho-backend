'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `user_groups`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  19-user-groups: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('user_groups', [
      { userId: 1, groupId: 1, createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, groupId: 2, createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, groupId: 1, createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, groupId: 2, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_groups', null, {});
  }
};
