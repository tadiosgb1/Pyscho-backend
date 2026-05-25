'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `UserPermissions`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  07-user-permissions: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('UserPermissions', [
      { userId: 2, permissionId: 3, createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, permissionId: 4, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserPermissions', null, {});
  }
};
