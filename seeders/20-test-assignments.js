'use strict';

// Seeded data references:
// Users:  1 = Admin, 2 = Tadesse, 3 = Sara
// Groups: 1 = Research Team A, 2 = Clinical Group B
// Tests:  1 = MBTI Personality Assessment (from 10-tests.js)
// Assigner: 1 = Admin

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await queryInterface.bulkInsert('test_assignments', [
      // Assign MBTI test directly to Tadesse (user)
      {
        test_id:          1,
        assigned_to_type: 'user',
        assigned_to_id:   2,
        assigned_by:      1,
        due_date:         dueDate,
        status:           'pending',
        notes:            'Please complete before the team review session.',
        createdAt:        now,
        updatedAt:        now,
      },
      // Assign MBTI test directly to Sara (user)
      {
        test_id:          1,
        assigned_to_type: 'user',
        assigned_to_id:   3,
        assigned_by:      1,
        due_date:         dueDate,
        status:           'completed',
        notes:            null,
        createdAt:        now,
        updatedAt:        now,
      },
      // Assign MBTI test to Research Team A (group)
      {
        test_id:          1,
        assigned_to_type: 'group',
        assigned_to_id:   1,
        assigned_by:      1,
        due_date:         dueDate,
        status:           'pending',
        notes:            'All members of Research Team A must complete this assessment.',
        createdAt:        now,
        updatedAt:        now,
      },
      // Assign MBTI test to Clinical Group B (group)
      {
        test_id:          1,
        assigned_to_type: 'group',
        assigned_to_id:   2,
        assigned_by:      1,
        due_date:         null,
        status:           'pending',
        notes:            null,
        createdAt:        now,
        updatedAt:        now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('test_assignments', null, {});
  },
};
