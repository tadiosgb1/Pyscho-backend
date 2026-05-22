const { Op } = require("sequelize");
const db = require("../models");
const Invoice = db.Invoice;

// Helper: generate invoice number like INV-2026-0001
async function generateInvoiceNumber() {
  const year  = new Date().getFullYear();
  const count = await Invoice.count({
    where: {
      invoice_number: { [Op.like]: `INV-${year}-%` },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

module.exports = {

  // GET /api/invoices
  async getAll(req, res) {
    try {
      let page      = parseInt(req.query.page)      || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      if (page < 1)      page      = 1;
      if (page_size < 1) page_size = 10;

      // ── Role-based filtering ────────────────────────────────────────────
      const userId = req.user?.id;
      const user = await db.User.findByPk(userId, {
        include: [{ model: db.Role, attributes: ['name'] }]
      });

      const userRoles = user?.Roles?.map(r => r.name.toLowerCase()) || [];
      const isAdmin = userRoles.includes('admin');
      const organizationId = user?.organization_id;

      const where = {};

      // If not admin, filter by organization
      if (!isAdmin && organizationId) {
        where.organization_id = organizationId;
      }

      // Additional query filters
      if (req.query.organization_id)  where.organization_id  = parseInt(req.query.organization_id);
      if (req.query.subscription_id)  where.subscription_id  = parseInt(req.query.subscription_id);
      if (req.query.status)           where.status           = req.query.status;
      // ────────────────────────────────────────────────────────────────────

      const offset = (page - 1) * page_size;

      const { rows, count } = await Invoice.findAndCountAll({
        where,
        offset,
        limit: page_size,
        order: [["issued_at", "DESC"]],
        include: [
          { model: db.Organization, as: "organization", attributes: ["id", "name"] },
          {
            model: db.Subscription, as: "subscription",
            include: [{ model: db.Plan, as: "plan", attributes: ["id", "slug", "name"] }],
          },
        ],
      });

      const total_pages = Math.ceil(count / page_size);
      const baseUrl     = `${req.protocol}://${req.get("host")}${req.path}`;

      res.json({
        count,
        total_pages,
        current_page: page,
        next:     page < total_pages ? `${baseUrl}?page=${page + 1}&page_size=${page_size}` : null,
        previous: page > 1           ? `${baseUrl}?page=${page - 1}&page_size=${page_size}` : null,
        page_size,
        data: rows,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/invoices/:id
  async getOne(req, res) {
    try {
      const invoice = await Invoice.findByPk(req.params.id, {
        include: [
          { model: db.Organization, as: "organization" },
          {
            model: db.Subscription, as: "subscription",
            include: [{ model: db.Plan, as: "plan" }],
          },
        ],
      });
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      // ── Role-based access check ─────────────────────────────────────────
      const userId = req.user?.id;
      const user = await db.User.findByPk(userId, {
        include: [{ model: db.Role, attributes: ['name'] }]
      });

      const userRoles = user?.Roles?.map(r => r.name.toLowerCase()) || [];
      const isAdmin = userRoles.includes('admin');
      const organizationId = user?.organization_id;

      // Non-admin users can only view their organization's invoices
      if (!isAdmin && invoice.organization_id !== organizationId) {
        return res.status(403).json({ error: "Access denied" });
      }
      // ────────────────────────────────────────────────────────────────────

      res.json(invoice);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/invoices  — create invoice for a subscription period
  async create(req, res) {
    try {
      const {
        subscription_id, organization_id,
        amount_cents, currency,
        period_start, period_end,
        due_date, notes,
      } = req.body;

      if (!subscription_id || !organization_id || !amount_cents || !period_start || !period_end) {
        return res.status(400).json({
          error: "subscription_id, organization_id, amount_cents, period_start, period_end are required",
        });
      }

      const invoice_number = await generateInvoiceNumber();

      const invoice = await Invoice.create({
        subscription_id,
        organization_id,
        invoice_number,
        amount_cents,
        currency:  currency    || "USD",
        status:    "issued",
        period_start,
        period_end,
        issued_at: new Date(),
        due_date:  due_date    || null,
        notes:     notes       || null,
      });

      res.status(201).json(invoice);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // PATCH /api/invoices/:id/pay  — mark invoice as paid
  async markPaid(req, res) {
    try {
      const invoice = await Invoice.findByPk(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      if (invoice.status === "paid") {
        return res.status(409).json({ error: "Invoice is already paid" });
      }

      await invoice.update({
        status:       "paid",
        paid_at:      new Date(),
        external_ref: req.body.external_ref || invoice.external_ref,
      });

      res.json({ success: true, invoice });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // PATCH /api/invoices/:id/cancel
  async cancel(req, res) {
    try {
      const invoice = await Invoice.findByPk(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      await invoice.update({ status: "cancelled" });
      res.json({ success: true, id: invoice.id, status: "cancelled" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
