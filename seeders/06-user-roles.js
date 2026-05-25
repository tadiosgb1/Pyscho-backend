'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `UserRoles`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  06-user-roles: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('UserRoles', [
      { userId: 1, roleId: 1, createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, roleId: 2, createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, roleId: 3, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserRoles', null, {});
  }
};
