'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `Roles`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  03-roles: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('Roles', [
      {
        name: 'admin',
        description: 'System owner — full access to everything',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'organization',
        description: 'Organization admin — manages their own members and views results',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'tester',
        description: 'Individual tester — can take tests and view own results',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
