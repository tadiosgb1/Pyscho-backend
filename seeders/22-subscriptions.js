'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS cnt FROM `subscriptions`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('  ⏭  22-subscriptions: already seeded, skipping.');
      return;
    }

    const now      = new Date();
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch plan IDs dynamically — avoids hardcoding
    const plans = await queryInterface.sequelize.query(
      "SELECT id, slug FROM `plans`",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const planMap = {};
    plans.forEach(p => { planMap[p.slug] = p.id; });

    if (!planMap['professional'] || !planMap['starter']) {
      console.warn('  ⚠  22-subscriptions: required plans not found, skipping.');
      return;
    }

    await queryInterface.bulkInsert('subscriptions', [
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
        notes:            'Initial subscription for GYZ Psycho Institute.',
        createdAt:        now,
        updatedAt:        now
      },
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
        updatedAt:        now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscriptions', null, {});
  }
};
