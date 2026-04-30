'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('plans', [
      // ── FREE ──────────────────────────────────────────────────────────────
      {
        slug:                  'free',
        name:                  'Free',
        description:           'Get started at no cost. Perfect for individuals and small teams exploring the platform.',
        billing_cycle:         'monthly',
        price_cents:           0,
        currency:              'USD',
        max_users:             5,
        max_tests:             2,
        max_groups:            1,
        max_test_assignments:  10,
        has_custom_branding:   false,
        has_analytics:         false,
        has_api_access:        false,
        has_priority_support:  false,
        has_export:            false,
        is_active:             true,
        sort_order:            1,
        createdAt:             now,
        updatedAt:             now,
      },

      // ── STARTER ───────────────────────────────────────────────────────────
      {
        slug:                  'starter',
        name:                  'Starter',
        description:           'Ideal for small organizations running regular assessments with basic reporting.',
        billing_cycle:         'monthly',
        price_cents:           4900,   // $49 / month
        currency:              'USD',
        max_users:             25,
        max_tests:             10,
        max_groups:            5,
        max_test_assignments:  100,
        has_custom_branding:   false,
        has_analytics:         true,
        has_api_access:        false,
        has_priority_support:  false,
        has_export:            true,
        is_active:             true,
        sort_order:            2,
        createdAt:             now,
        updatedAt:             now,
      },

      // ── PROFESSIONAL ──────────────────────────────────────────────────────
      {
        slug:                  'professional',
        name:                  'Professional',
        description:           'For growing organizations that need advanced analytics, branding, and API access.',
        billing_cycle:         'monthly',
        price_cents:           14900,  // $149 / month
        currency:              'USD',
        max_users:             100,
        max_tests:             50,
        max_groups:            20,
        max_test_assignments:  500,
        has_custom_branding:   true,
        has_analytics:         true,
        has_api_access:        true,
        has_priority_support:  false,
        has_export:            true,
        is_active:             true,
        sort_order:            3,
        createdAt:             now,
        updatedAt:             now,
      },

      // ── ENTERPRISE ────────────────────────────────────────────────────────
      {
        slug:                  'enterprise',
        name:                  'Enterprise',
        description:           'Unlimited scale with dedicated support, custom integrations, and SLA guarantees.',
        billing_cycle:         'monthly',
        price_cents:           49900,  // $499 / month
        currency:              'USD',
        max_users:             -1,     // unlimited
        max_tests:             -1,
        max_groups:            -1,
        max_test_assignments:  -1,
        has_custom_branding:   true,
        has_analytics:         true,
        has_api_access:        true,
        has_priority_support:  true,
        has_export:            true,
        is_active:             true,
        sort_order:            4,
        createdAt:             now,
        updatedAt:             now,
      },

      // ── PROFESSIONAL YEARLY (discounted) ──────────────────────────────────
      {
        slug:                  'professional_yearly',
        name:                  'Professional (Yearly)',
        description:           'Professional plan billed annually — save 20% compared to monthly.',
        billing_cycle:         'yearly',
        price_cents:           142800, // $1,428 / year (~$119/mo, 20% off)
        currency:              'USD',
        max_users:             100,
        max_tests:             50,
        max_groups:            20,
        max_test_assignments:  500,
        has_custom_branding:   true,
        has_analytics:         true,
        has_api_access:        true,
        has_priority_support:  false,
        has_export:            true,
        is_active:             true,
        sort_order:            5,
        createdAt:             now,
        updatedAt:             now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plans', null, {});
  },
};
