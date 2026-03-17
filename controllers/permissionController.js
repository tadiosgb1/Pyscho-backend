const { Permission, Op } = require("../models");
module.exports = {
  async getAll(req, res) {
    try {
      let page = parseInt(req.query.page) || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search = req.query.search || "";
      let ordering = req.query.ordering || "id";
      if (page < 1) page = 1;
      if (page_size < 1) page_size = 10;
      const where = search ? { code: { [Op.like]: '%' + search + '%' } } : {};
      const order = ordering.startsWith("-") ? [[ordering.slice(1), "DESC"]] : [[ordering, "ASC"]];
      const offset = (page - 1) * page_size;
      const { rows, count } = await Permission.findAndCountAll({ where, order, offset, limit: page_size });
      const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
      const total_pages = Math.ceil(count / page_size);
      res.json({ count, total_pages, current_page: page, next: page < total_pages ? `${baseUrl}?page=${page + 1}&page_size=${page_size}` : null, previous: page > 1 ? `${baseUrl}?page=${page - 1}&page_size=${page_size}` : null, page_size, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async getOne(req, res) { try { const permission = await Permission.findByPk(req.params.id); if (!permission) return res.status(404).json({ error: "Not found" }); res.json(permission); } catch (e) { res.status(500).json({ error: e.message }); } },

  async create(req, res) { try { const permission = await Permission.create(req.body); res.json(permission); } catch (e) { res.status(500).json({ error: e.message }); } },

  async patch(req, res) { try { const permission = await Permission.findByPk(req.params.id); if (!permission) return res.status(404).json({ error: "Not found" }); Object.assign(permission, req.body); await permission.save(); res.json(permission); } catch (e) { res.status(500).json({ error: e.message }); } },

  async update(req, res) { try { const [affected] = await Permission.update(req.body, { where: { id: req.params.id } }); if (!affected) return res.status(404).json({ error: "Not found" }); const updated = await Permission.findByPk(req.params.id); res.json(updated); } catch (e) { res.status(500).json({ error: e.message }); } },

  async delete(req, res) { try { const deleted = await Permission.destroy({ where: { id: req.params.id } }); if (!deleted) return res.status(404).json({ error: "Not found" }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } }
};