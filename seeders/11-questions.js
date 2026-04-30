'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('questions', [
      {
        question_text: 'Do you feel energized after spending time with a large group of people?',
        category_id: 1,
        type: 'multiple',
        test_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question_text: 'Do you prefer to focus on the present moment rather than future possibilities?',
        category_id: 2,
        type: 'multiple',
        test_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question_text: 'When making a decision, do you rely more on logic than personal feelings?',
        category_id: 3,
        type: 'likert',
        test_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question_text: 'Do you prefer to have a detailed plan before starting a project?',
        category_id: 4,
        type: 'multiple',
        test_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question_text: 'How well do you recognize emotions in others?',
        category_id: 1,
        type: 'likert',
        test_id: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('questions', null, {});
  }
};
