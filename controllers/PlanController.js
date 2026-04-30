const db = require("../models");
const Plan = db.Plan;

module.exports = {

  // GET /api/plans  — list all active plans (public pricing page)
  async getAll(req, res) {
    try {
      const showInactive = req.query.show_inactive === "true";
      const where = showInactive ? {} : { is_active: true };

      const plans = await Plan.findAll({
        where,
        order: [["sort_order", "ASC"], ["price_cents", "ASC"]],
      });

      res.json({ count: plans.length, data: plans });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/plans/:id
  async getOne(req, res) {
    try {
      const plan = await Plan.findByPk(req.params.id);
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      res.json(plan);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/plans  — admin only
  async create(req, res) {
    try {
      const plan = await Plan.create(req.body);
      res.status(201).json(plan);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // PUT /api/plans/:id  — admin only
  async update(req, res) {
    try {
      const plan = await Plan.findByPk(req.params.id);
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      await plan.update(req.body);
      res.json(plan);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // DELETE /api/plans/:id  — admin only (soft-delete via is_active)
  async delete(req, res) {
    try {
      const plan = await Plan.findByPk(req.params.id);
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      await plan.update({ is_active: false });
      res.json({ success: true, message: "Plan deactivated" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
