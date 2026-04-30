'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Extraversion vs Introversion',
        description: 'Measures how a person gains energy — from others or from within.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sensing vs Intuition',
        description: 'Measures how a person perceives information.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Thinking vs Feeling',
        description: 'Measures how a person makes decisions.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Judging vs Perceiving',
        description: 'Measures how a person approaches structure and planning.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
