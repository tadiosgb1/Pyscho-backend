'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `test_assignments`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  20-test-assignments: already seeded, skipping.');
      return;
    }

    const now     = new Date();
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('test_assignments', [
      {
        test_id: 1, assigned_to_type: 'user',  assigned_to_id: 2, assigned_by: 1,
        due_date: dueDate, status: 'pending',
        notes: 'Please complete before the team review session.',
        createdAt: now, updatedAt: now
      },
      {
        test_id: 1, assigned_to_type: 'user',  assigned_to_id: 3, assigned_by: 1,
        due_date: dueDate, status: 'completed',
        notes: null,
        createdAt: now, updatedAt: now
      },
      {
        test_id: 1, assigned_to_type: 'group', assigned_to_id: 1, assigned_by: 1,
        due_date: dueDate, status: 'pending',
        notes: 'All members of Research Team A must complete this assessment.',
        createdAt: now, updatedAt: now
      },
      {
        test_id: 1, assigned_to_type: 'group', assigned_to_id: 2, assigned_by: 1,
        due_date: null, status: 'pending',
        notes: null,
        createdAt: now, updatedAt: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('test_assignments', null, {});
  }
};
