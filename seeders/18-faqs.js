'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('faks', [
      {
        question: 'What is the MBTI personality test?',
        answer: 'The Myers-Briggs Type Indicator (MBTI) is a self-report questionnaire that categorizes people into 16 personality types based on four dichotomies: Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, and Judging/Perceiving.',
        is_active: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'How long does a typical assessment take?',
        answer: 'Most assessments take between 20 to 45 minutes depending on the test type. You can pause and resume at any time.',
        is_active: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Are my results kept confidential?',
        answer: 'Yes. All your results are stored securely and are only accessible to you and authorized professionals within your organization.',
        is_active: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Can I retake a test?',
        answer: 'Yes, you can retake any test. Your previous results will be saved so you can track changes over time.',
        is_active: false,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('faks', null, {});
  }
};
