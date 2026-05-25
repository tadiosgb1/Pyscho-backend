'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `options`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  12-options: already seeded, skipping.');
      return;
    }

    await queryInterface.bulkInsert('options', [
      // Q1 — Extraversion vs Introversion
      { text: 'Yes, always',              triat_id: 1, question_id: 1, value: 'extravert',  weight: 2, position: 1, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Sometimes',                triat_id: 1, question_id: 1, value: 'extravert',  weight: 1, position: 2, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Rarely',                   triat_id: 2, question_id: 1, value: 'introvert',  weight: 1, position: 3, createdAt: new Date(), updatedAt: new Date() },
      { text: 'No, never',                triat_id: 2, question_id: 1, value: 'introvert',  weight: 2, position: 4, createdAt: new Date(), updatedAt: new Date() },
      // Q2 — Sensing vs Intuition
      { text: 'Yes, I focus on now',      triat_id: 3, question_id: 2, value: 'sensing',    weight: 2, position: 1, createdAt: new Date(), updatedAt: new Date() },
      { text: 'I balance both',           triat_id: 3, question_id: 2, value: 'sensing',    weight: 1, position: 2, createdAt: new Date(), updatedAt: new Date() },
      { text: 'I think about the future', triat_id: 4, question_id: 2, value: 'intuition',  weight: 2, position: 3, createdAt: new Date(), updatedAt: new Date() },
      // Q3 — Thinking vs Feeling (likert)
      { text: 'Strongly Agree',           triat_id: 5, question_id: 3, value: 'thinking',   weight: 2, position: 1, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Agree',                    triat_id: 5, question_id: 3, value: 'thinking',   weight: 1, position: 2, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Neutral',                  triat_id: 5, question_id: 3, value: 'neutral',    weight: 0, position: 3, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Disagree',                 triat_id: 6, question_id: 3, value: 'feeling',    weight: 1, position: 4, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Strongly Disagree',        triat_id: 6, question_id: 3, value: 'feeling',    weight: 2, position: 5, createdAt: new Date(), updatedAt: new Date() },
      // Q4 — Judging vs Perceiving
      { text: 'Yes, always plan ahead',   triat_id: 7, question_id: 4, value: 'judging',    weight: 2, position: 1, createdAt: new Date(), updatedAt: new Date() },
      { text: 'I prefer to be flexible',  triat_id: 8, question_id: 4, value: 'perceiving', weight: 2, position: 2, createdAt: new Date(), updatedAt: new Date() },
      // Q5 — EQ test (likert)
      { text: 'Very well',                triat_id: 1, question_id: 5, value: 'high_eq',    weight: 3, position: 1, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Somewhat well',            triat_id: 1, question_id: 5, value: 'medium_eq',  weight: 2, position: 2, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Not very well',            triat_id: 2, question_id: 5, value: 'low_eq',     weight: 1, position: 3, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('options', null, {});
  }
};
