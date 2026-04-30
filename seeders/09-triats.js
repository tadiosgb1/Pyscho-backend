'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('triats', [
      { category_id: 1, name: 'Extraversion',  description: 'Energized by social interaction.',   createdAt: new Date(), updatedAt: new Date() },
      { category_id: 1, name: 'Introversion',  description: 'Energized by solitude and reflection.', createdAt: new Date(), updatedAt: new Date() },
      { category_id: 2, name: 'Sensing',       description: 'Focuses on concrete facts and details.', createdAt: new Date(), updatedAt: new Date() },
      { category_id: 2, name: 'Intuition',     description: 'Focuses on patterns and possibilities.', createdAt: new Date(), updatedAt: new Date() },
      { category_id: 3, name: 'Thinking',      description: 'Makes decisions based on logic.',        createdAt: new Date(), updatedAt: new Date() },
      { category_id: 3, name: 'Feeling',       description: 'Makes decisions based on values.',       createdAt: new Date(), updatedAt: new Date() },
      { category_id: 4, name: 'Judging',       description: 'Prefers structure and planning.',        createdAt: new Date(), updatedAt: new Date() },
      { category_id: 4, name: 'Perceiving',    description: 'Prefers flexibility and spontaneity.',   createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('triats', null, {});
  }
};
