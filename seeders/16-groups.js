'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `groups`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  16-groups: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('groups', [
      {
        name: 'Research Team A',
        description: 'Primary research group for personality studies.',
        organization: 'GYZ Psycho Institute',
        _id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Clinical Group B',
        description: 'Clinical assessment group.',
        organization: 'Mind & Wellness Center',
        _id: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('groups', null, {});
  }
};
