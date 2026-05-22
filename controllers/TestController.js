const { Op } = require("sequelize");
const db = require("../models");
const Test = db.Test;

/**
 * Resolve the role name(s) for a user from the DB.
 * Returns an array of lowercase role names, e.g. ["admin"], ["organization"], ["tester"]
 */
async function getUserRoles(userId) {
  const user = await db.User.findByPk(userId, {
    include: [{ model: db.Role }],
  });
  if (!user) return [];
  return (user.Roles || []).map(r => r.name.toLowerCase());
}

module.exports = {
  async getAll(req, res) {
    try {
      let page      = parseInt(req.query.page)      || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search    = req.query.search              || "";
      let ordering  = req.query.ordering            || "id";

      if (page < 1)      page      = 1;
      if (page_size < 1) page_size = 10;

      const searchableFields = ["title", "description", "duration"];
      const searchConditions = searchableFields.map(f => ({ [f]: { [Op.like]: `%${search}%` } }));
      const searchWhere = search ? { [Op.or]: searchConditions } : {};
      const order  = ordering.startsWith("-") ? [[ordering.slice(1), "DESC"]] : [[ordering, "ASC"]];
      const offset = (page - 1) * page_size;

      // ── Role-based scoping ──────────────────────────────────────────────────
      const userId = req.user?.id;
      const roles  = userId ? await getUserRoles(userId) : [];

      let testIds = null; // null = no restriction (admin sees all)

      if (roles.includes("admin")) {
        // Admin: sees every test — no extra filter
        testIds = null;

      } else if (roles.includes("organization")) {
        // Organization: sees tests assigned to the org's users or the org's groups
        const orgUser = await db.User.findByPk(userId, { attributes: ["organization_id"] });
        const orgId   = orgUser?.organization_id;

        if (!orgId) {
          // Org user with no org attached — return empty
          return res.json({ count: 0, total_pages: 0, current_page: page, next: null, previous: null, page_size, data: [] });
        }

        // All users that belong to this organization
        const orgUsers = await db.User.findAll({
          where: { organization_id: orgId },
          attributes: ["id"],
        });
        const orgUserIds = orgUsers.map(u => u.id);

        // All groups that belong to this organization
        const orgGroups = await db.Group.findAll({
          where: { _id: orgId },
          attributes: ["id"],
        });
        const orgGroupIds = orgGroups.map(g => g.id);

        console.log('Organization Test Filter:', { 
          orgId, 
          orgUserIds, 
          orgGroupIds,
          orgUsersCount: orgUsers.length,
          orgGroupsCount: orgGroups.length
        });

        // Build OR conditions only if we have valid IDs
        const orConditions = [];
        if (orgUserIds.length > 0) {
          orConditions.push({ assigned_to_type: "user", assigned_to_id: { [Op.in]: orgUserIds } });
        }
        if (orgGroupIds.length > 0) {
          orConditions.push({ assigned_to_type: "group", assigned_to_id: { [Op.in]: orgGroupIds } });
        }

        // If no users or groups in org, return empty
        if (orConditions.length === 0) {
          console.log('No users or groups found for organization:', orgId);
          return res.json({ count: 0, total_pages: 0, current_page: page, next: null, previous: null, page_size, data: [] });
        }

        // Test assignments targeting those users or groups
        const assignments = await db.TestAssignment.findAll({
          where: { [Op.or]: orConditions },
          attributes: ["test_id", "assigned_to_type", "assigned_to_id"],
        });

        console.log('Found assignments:', assignments.length);
        if (assignments.length > 0) {
          console.log('Sample assignments:', assignments.slice(0, 3).map(a => ({ 
            test_id: a.test_id, 
            type: a.assigned_to_type, 
            id: a.assigned_to_id 
          })));
        }

        testIds = [...new Set(assignments.map(a => a.test_id))];
        console.log('Unique test IDs:', testIds);

      } else {
        // Tester (or any other role): sees only tests directly assigned to them
        // or assigned to a group they belong to

        // Direct user assignments
        const directAssignments = await db.TestAssignment.findAll({
          where: { assigned_to_type: "user", assigned_to_id: userId },
          attributes: ["test_id"],
        });

        // Groups this user belongs to
        const userGroups = await db.UserGroup.findAll({
          where: { userId },
          attributes: ["groupId"],
        });
        const groupIds = userGroups.map(ug => ug.groupId);

        let groupAssignments = [];
        if (groupIds.length > 0) {
          groupAssignments = await db.TestAssignment.findAll({
            where: { assigned_to_type: "group", assigned_to_id: { [Op.in]: groupIds } },
            attributes: ["test_id"],
          });
        }

        testIds = [...new Set([
          ...directAssignments.map(a => a.test_id),
          ...groupAssignments.map(a => a.test_id),
        ])];
      }

      // Build final where clause
      const where = { ...searchWhere };
      if (testIds !== null) {
        if (testIds.length === 0) {
          // No tests assigned - return empty result
          console.log('No test assignments found for this user/organization');
          return res.json({ 
            count: 0, 
            total_pages: 0, 
            current_page: page, 
            next: null, 
            previous: null, 
            page_size, 
            data: [] 
          });
        }
        where.id = { [Op.in]: testIds };
      }
      console.log('Final where clause:', JSON.stringify(where, null, 2));
      // ───────────────────────────────────────────────────────────────────────

      const { rows, count } = await Test.findAndCountAll({
        where,
        order,
        offset,
        limit: page_size,
        include: [db.User],
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
        data: rows.map(item => item.toJSON()),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getOne(req, res) {
    try {
      const include = [db.User].filter(Boolean);
      const opts = include.length ? { include } : {};
      const data = await Test.findByPk(req.params.id, opts);
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
      
      const data = await Test.create(body);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const body = { ...req.body };
      
      await Test.update(body, { where: { id: req.params.id } });
      const updated = await Test.findByPk(req.params.id);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async delete(req, res) {
    try {
      await Test.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};
