'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `contacts`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  17-contacts: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('contacts', [
      {
        name: 'Abebe Girma',
        email: 'abebe@example.com',
        phone: '+251911000020',
        message: 'I would like to learn more about your psychological assessment services.',
        sent_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Meron Tadesse',
        email: 'meron@example.com',
        phone: '+251911000021',
        message: 'Can I schedule a consultation with one of your psychologists?',
        sent_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('contacts', null, {});
  }
};
