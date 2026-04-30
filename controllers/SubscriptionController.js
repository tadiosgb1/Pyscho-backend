const { Op } = require("sequelize");
const db = require("../models");
const Subscription = db.Subscription;

module.exports = {

  // GET /api/subscriptions  — admin: all subscriptions
  async getAll(req, res) {
    try {
      let page      = parseInt(req.query.page)      || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      if (page < 1)      page      = 1;
      if (page_size < 1) page_size = 10;

      const where = {};
      if (req.query.organization_id) where.organization_id = parseInt(req.query.organization_id);
      if (req.query.status)          where.status          = req.query.status;
      if (req.query.plan_id)         where.plan_id         = parseInt(req.query.plan_id);

      const offset = (page - 1) * page_size;

      const { rows, count } = await Subscription.findAndCountAll({
        where,
        offset,
        limit: page_size,
        order: [["createdAt", "DESC"]],
        include: [
          { model: db.Organization, as: "organization", attributes: ["id", "name", "official_email"] },
          { model: db.Plan,         as: "plan",         attributes: ["id", "slug", "name", "price_cents", "currency", "billing_cycle"] },
          { model: db.User,         as: "activatedBy",  attributes: ["id", "first_name", "last_name", "email"] },
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

  // GET /api/subscriptions/:id
  async getOne(req, res) {
    try {
      const sub = await Subscription.findByPk(req.params.id, {
        include: [
          { model: db.Organization, as: "organization" },
          { model: db.Plan,         as: "plan" },
          { model: db.User,         as: "activatedBy", attributes: ["id", "first_name", "last_name", "email"] },
          { model: db.Invoice,      as: "invoices", order: [["issued_at", "DESC"]] },
        ],
      });
      if (!sub) return res.status(404).json({ error: "Subscription not found" });
      res.json(sub);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/subscriptions/organization/:orgId  — active subscription for an org
  async getForOrganization(req, res) {
    try {
      const sub = await Subscription.findOne({
        where: {
          organization_id: parseInt(req.params.orgId),
          status: { [Op.in]: ["trialing", "active"] },
        },
        order: [["createdAt", "DESC"]],
        include: [
          { model: db.Plan, as: "plan" },
        ],
      });

      if (!sub) {
        // Return free plan info if no active subscription
        const freePlan = await db.Plan.findOne({ where: { slug: "free" } });
        return res.json({ subscription: null, plan: freePlan });
      }

      res.json({ subscription: sub, plan: sub.plan });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/subscriptions  — assign a plan to an org
  async create(req, res) {
    try {
      const {
        organization_id, plan_id, started_at,
        expires_at, trial_ends_at, notes, external_ref,
      } = req.body;

      const activated_by = req.user?.id || parseInt(req.body.activated_by);

      if (!organization_id || !plan_id) {
        return res.status(400).json({ error: "organization_id and plan_id are required" });
      }

      // Verify org and plan exist
      const org  = await db.Organization.findByPk(organization_id);
      const plan = await db.Plan.findByPk(plan_id);
      if (!org)  return res.status(404).json({ error: "Organization not found" });
      if (!plan) return res.status(404).json({ error: "Plan not found" });

      // Cancel any existing active subscription for this org
      await Subscription.update(
        { status: "cancelled" },
        {
          where: {
            organization_id,
            status: { [Op.in]: ["trialing", "active"] },
          },
        }
      );

      const sub = await Subscription.create({
        organization_id,
        plan_id,
        activated_by,
        status:        "active",
        started_at:    started_at    || new Date(),
        expires_at:    expires_at    || null,
        trial_ends_at: trial_ends_at || null,
        notes:         notes         || null,
        external_ref:  external_ref  || null,
      });

      const result = await Subscription.findByPk(sub.id, {
        include: [
          { model: db.Organization, as: "organization", attributes: ["id", "name"] },
          { model: db.Plan,         as: "plan" },
        ],
      });

      res.status(201).json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // PATCH /api/subscriptions/:id/status  — cancel, expire, etc.
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const valid = ["trialing", "active", "past_due", "cancelled", "expired"];
      if (!valid.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${valid.join(", ")}` });
      }

      const sub = await Subscription.findByPk(req.params.id);
      if (!sub) return res.status(404).json({ error: "Subscription not found" });

      await sub.update({ status });
      res.json({ success: true, id: sub.id, status: sub.status });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // PATCH /api/subscriptions/:id/usage  — increment usage counters
  async updateUsage(req, res) {
    try {
      const { used_users, used_tests, used_assignments } = req.body;
      const sub = await Subscription.findByPk(req.params.id);
      if (!sub) return res.status(404).json({ error: "Subscription not found" });

      const updates = {};
      if (used_users       !== undefined) updates.used_users       = used_users;
      if (used_tests       !== undefined) updates.used_tests       = used_tests;
      if (used_assignments !== undefined) updates.used_assignments = used_assignments;

      await sub.update(updates);
      res.json(sub);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
