'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now        = new Date();
    const periodEnd  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dueDate    = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Fetch subscription IDs
    const subs = await queryInterface.sequelize.query(
      "SELECT id, organization_id FROM `subscriptions` ORDER BY id ASC",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (subs.length < 2) return; // safety check

    await queryInterface.bulkInsert('invoices', [
      // Invoice for Alpha Psycho Institute (Professional plan — $149)
      {
        subscription_id:  subs[0].id,
        organization_id:  subs[0].organization_id,
        invoice_number:   `INV-${now.getFullYear()}-0001`,
        amount_cents:     14900,
        currency:         'USD',
        status:           'paid',
        period_start:     now,
        period_end:       periodEnd,
        issued_at:        now,
        due_date:         dueDate,
        paid_at:          now,
        external_ref:     null,
        pdf_url:          null,
        notes:            'First billing cycle — Professional plan.',
        createdAt:        now,
        updatedAt:        now,
      },
      // Invoice for Mind & Wellness Center (Starter plan — $49)
      {
        subscription_id:  subs[1].id,
        organization_id:  subs[1].organization_id,
        invoice_number:   `INV-${now.getFullYear()}-0002`,
        amount_cents:     4900,
        currency:         'USD',
        status:           'issued',
        period_start:     now,
        period_end:       periodEnd,
        issued_at:        now,
        due_date:         dueDate,
        paid_at:          null,
        external_ref:     null,
        pdf_url:          null,
        notes:            null,
        createdAt:        now,
        updatedAt:        now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('invoices', null, {});
  },
};
