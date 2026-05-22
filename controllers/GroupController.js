const { Op } = require("sequelize");
const db = require("../models");
const Group = db.Group;

module.exports = {
  async getAll(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get current user's role and organization
      const currentUser = await db.User.findByPk(req.user.id, {
        include: [{ model: db.Role, attributes: ['name'] }]
      });

      if (!currentUser) {
        return res.status(404).json({ error: "Current user not found" });
      }

      const userRoles = (currentUser.Roles || []).map(r => r.name);
      const isAdmin = userRoles.includes('admin');
      const isOrganization = userRoles.includes('organization');
      const organizationId = currentUser.organization_id;

      console.log('GroupController.getAll:', { userId: req.user.id, userRoles, organizationId });

      let page = parseInt(req.query.page) || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search = req.query.search || "";
      let ordering = req.query.ordering || "id";

      if (page < 1) page = 1;
      if (page_size < 1) page_size = 10;

      const searchableFields = ["name", "description"];
      const searchConditions = searchableFields.map(field => ({ [field]: { [Op.like]: "%" + search + "%" } }));
      const searchWhere = search ? { [Op.or]: searchConditions } : {};

      // 🔒 Role-based filtering
      let where = { ...searchWhere };

      if (isOrganization && organizationId) {
        // Organization sees only their own groups
        where._id = organizationId;
      } else if (!isAdmin) {
        // Tester sees only groups they belong to
        const userGroups = await db.UserGroup.findAll({
          where: { userId: req.user.id },
          attributes: ['groupId']
        });
        const groupIds = userGroups.map(ug => ug.groupId);
        where.id = groupIds.length ? { [Op.in]: groupIds } : { [Op.in]: [0] }; // [0] = return nothing
      }
      // Admin sees all groups (no additional filter)

      // Allow manual organization_id filter (for admin)
      if (req.query.organization_id && isAdmin) {
        where._id = parseInt(req.query.organization_id);
      }

      const order = ordering.startsWith("-") ? [[ordering.slice(1), "DESC"]] : [[ordering, "ASC"]];
      const offset = (page - 1) * page_size;

      const include = [db.Organization].filter(Boolean);
      const findOptions = { where, order, offset, limit: page_size };
      if (include.length) findOptions.include = include;

      const { rows, count } = await Group.findAndCountAll(findOptions);

      const host = `${req.protocol}://${req.get("host")}`;
      const dataWithFiles = rows.map(item => {
        const obj = item.toJSON();
        
        return obj;
      });

      const total_pages = Math.ceil(count / page_size);
      const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;

      res.json({
        count,
        total_pages,
        current_page: page,
        next: page < total_pages ? `${baseUrl}?page=${page + 1}&page_size=${page_size}` : null,
        previous: page > 1 ? `${baseUrl}?page=${page - 1}&page_size=${page_size}` : null,
        page_size,
        data: dataWithFiles
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getOne(req, res) {
    try {
      const include = [db.Organization].filter(Boolean);
      const opts = include.length ? { include } : {};
      const data = await Group.findByPk(req.params.id, opts);
      if (!data) return res.status(404).json({ error: "Not found" });

      const obj = data.toJSON();
      const host = `${req.protocol}://${req.get("host")}`;
      
      res.json(obj);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const body = { ...req.body };
      
      const data = await Group.create(body);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const body = { ...req.body };
      
      await Group.update(body, { where: { id: req.params.id } });
      const updated = await Group.findByPk(req.params.id);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async delete(req, res) {
    try {
      await Group.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};
