'use strict';

// Organizations: 1 = Alpha Psycho Institute, 2 = Mind & Wellness Center
// Plans seeded in order: 1=free, 2=starter, 3=professional, 4=enterprise, 5=professional_yearly
// Admin user: id = 1

module.exports = {
  async up(queryInterface, Sequelize) {
    const now      = new Date();
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const oneYear  = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Fetch plan IDs dynamically to avoid hardcoding
    const plans = await queryInterface.sequelize.query(
      "SELECT id, slug FROM `plans`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const planMap = {};
    plans.forEach(p => { planMap[p.slug] = p.id; });

    await queryInterface.bulkInsert('subscriptions', [
      // Alpha Psycho Institute → Professional plan
      {
        organization_id:  1,
        plan_id:          planMap['professional'],
        activated_by:     1,
        status:           'active',
        started_at:       now,
        expires_at:       oneMonth,
        trial_ends_at:    null,
        auto_renew:       true,
        external_ref:     null,
        used_users:       3,
        used_tests:       1,
        used_assignments: 4,
        notes:            'Initial subscription for Alpha Psycho Institute.',
        createdAt:        now,
        updatedAt:        now,
      },
      // Mind & Wellness Center → Starter plan
      {
        organization_id:  2,
        plan_id:          planMap['starter'],
        activated_by:     1,
        status:           'active',
        started_at:       now,
        expires_at:       oneMonth,
        trial_ends_at:    null,
        auto_renew:       true,
        external_ref:     null,
        used_users:       1,
        used_tests:       1,
        used_assignments: 2,
        notes:            null,
        createdAt:        now,
        updatedAt:        now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscriptions', null, {});
  },
};
