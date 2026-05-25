'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `organizations`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  01-organizations: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('organizations', [
      {
        name: 'GYZ Psycho Institute',
        address: '123 Main Street, Addis Ababa',
        official_email: 'info@gyzpsycho.com',
        official_phone: '+251911000001',
        org_type: 'Research',
        description: 'Leading psychological assessment organization.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mind & Wellness Center',
        address: '456 Bole Road, Addis Ababa',
        official_email: 'contact@mindwellness.com',
        official_phone: '+251911000002',
        org_type: 'Clinical',
        description: 'Providing mental health and wellness services.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('organizations', null, {});
  }
};
