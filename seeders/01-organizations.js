'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('organizations', [
      {
        name: 'Alpha Psycho Institute',
        address: '123 Main Street, Addis Ababa',
        official_email: 'info@alphapsycho.com',
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
