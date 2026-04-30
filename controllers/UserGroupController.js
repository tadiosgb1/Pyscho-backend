const { Op } = require("sequelize");
const db = require("../models");
const UserGroup = db.UserGroup;
const User = db.User;
const Group = db.Group;

module.exports = {

  // GET /api/user-groups
  // List all user-group memberships with pagination + search
  async getAll(req, res) {
    try {
      let page      = parseInt(req.query.page)      || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search    = req.query.search              || "";

      if (page < 1)      page      = 1;
      if (page_size < 1) page_size = 10;

      const offset = (page - 1) * page_size;

      // Build user/group search filter via include where
      const userWhere  = search ? { [Op.or]: [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name:  { [Op.like]: `%${search}%` } },
        { email:      { [Op.like]: `%${search}%` } }
      ]} : {};

      const groupWhere = search
        ? { name: { [Op.like]: `%${search}%` } }
        : {};

      const { rows, count } = await UserGroup.findAndCountAll({
        offset,
        limit: page_size,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "first_name", "middle_name", "last_name", "email", "phone"],
            where: Object.keys(userWhere).length ? userWhere : undefined,
            required: false
          },
          {
            model: Group,
            as: "group",
            attributes: ["id", "name", "description"],
            where: Object.keys(groupWhere).length ? groupWhere : undefined,
            required: false
          }
        ],
        order: [["id", "ASC"]]
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
        data: rows
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/user-groups/:id
  // Get a single membership record
  async getOne(req, res) {
    try {
      const record = await UserGroup.findByPk(req.params.id, {
        include: [
          { model: User,  as: "user",  attributes: ["id", "first_name", "middle_name", "last_name", "email", "phone"] },
          { model: Group, as: "group", attributes: ["id", "name", "description"] }
        ]
      });
      if (!record) return res.status(404).json({ error: "Membership not found" });
      res.json(record);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/user-groups/group/:groupId
  // Get all users in a specific group
  async getUsersByGroup(req, res) {
    try {
      let page      = parseInt(req.query.page)      || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search    = req.query.search              || "";

      if (page < 1)      page      = 1;
      if (page_size < 1) page_size = 10;

      const offset = (page - 1) * page_size;

      // Verify group exists
      const group = await Group.findByPk(req.params.groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const userWhere = search ? {
        [Op.or]: [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name:  { [Op.like]: `%${search}%` } },
          { email:      { [Op.like]: `%${search}%` } }
        ]
      } : {};

      const { rows, count } = await UserGroup.findAndCountAll({
        where: { groupId: req.params.groupId },
        offset,
        limit: page_size,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "first_name", "middle_name", "last_name", "email", "phone"],
            where: Object.keys(userWhere).length ? userWhere : undefined
          }
        ],
        order: [["id", "ASC"]]
      });

      const total_pages = Math.ceil(count / page_size);
      const baseUrl     = `${req.protocol}://${req.get("host")}${req.path}`;

      res.json({
        group: { id: group.id, name: group.name, description: group.description },
        count,
        total_pages,
        current_page: page,
        next:     page < total_pages ? `${baseUrl}?page=${page + 1}&page_size=${page_size}` : null,
        previous: page > 1           ? `${baseUrl}?page=${page - 1}&page_size=${page_size}` : null,
        page_size,
        data: rows.map(r => r.user)
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/user-groups/user/:userId
  // Get all groups a specific user belongs to
  async getGroupsByUser(req, res) {
    try {
      // Verify user exists
      const user = await User.findByPk(req.params.userId, {
        attributes: ["id", "first_name", "middle_name", "last_name", "email", "phone"]
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const records = await UserGroup.findAll({
        where: { userId: req.params.userId },
        include: [
          {
            model: Group,
            as: "group",
            attributes: ["id", "name", "description"]
          }
        ]
      });

      res.json({
        user,
        count: records.length,
        data: records.map(r => r.group)
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/user-groups
  // Add a user to a group  { userId, groupId }
  async create(req, res) {
    try {
      const { userId, groupId } = req.body;

      if (!userId || !groupId) {
        return res.status(400).json({ error: "userId and groupId are required" });
      }

      // Verify both exist
      const user  = await User.findByPk(userId);
      const group = await Group.findByPk(groupId);
      if (!user)  return res.status(404).json({ error: "User not found" });
      if (!group) return res.status(404).json({ error: "Group not found" });

      // Prevent duplicate membership
      const existing = await UserGroup.findOne({ where: { userId, groupId } });
      if (existing) {
        return res.status(409).json({ error: "User is already a member of this group" });
      }

      const record = await UserGroup.create({ userId, groupId });

      // Return with associations
      const result = await UserGroup.findByPk(record.id, {
        include: [
          { model: User,  as: "user",  attributes: ["id", "first_name", "middle_name", "last_name", "email"] },
          { model: Group, as: "group", attributes: ["id", "name", "description"] }
        ]
      });

      res.status(201).json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/user-groups/bulk
  // Add multiple users to a group at once  { groupId, userIds: [1, 2, 3] }
  async bulkAdd(req, res) {
    try {
      const { groupId, userIds } = req.body;

      if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "groupId and a non-empty userIds array are required" });
      }

      const group = await Group.findByPk(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      // Filter out already-existing memberships
      const existing = await UserGroup.findAll({
        where: { groupId, userId: { [Op.in]: userIds } }
      });
      const existingUserIds = existing.map(r => r.userId);
      const newUserIds      = userIds.filter(id => !existingUserIds.includes(id));

      if (newUserIds.length === 0) {
        return res.status(409).json({ error: "All provided users are already members of this group" });
      }

      const records = newUserIds.map(userId => ({ userId, groupId }));
      await UserGroup.bulkCreate(records);

      res.status(201).json({
        message: `${newUserIds.length} user(s) added to group`,
        added:   newUserIds,
        skipped: existingUserIds
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // DELETE /api/user-groups/:id
  // Remove a membership by its own ID
  async delete(req, res) {
    try {
      const record = await UserGroup.findByPk(req.params.id);
      if (!record) return res.status(404).json({ error: "Membership not found" });

      await record.destroy();
      res.json({ success: true, message: "User removed from group" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // DELETE /api/user-groups/group/:groupId/user/:userId
  // Remove a user from a group by userId + groupId (more intuitive)
  async removeUserFromGroup(req, res) {
    try {
      const { groupId, userId } = req.params;

      const record = await UserGroup.findOne({ where: { groupId, userId } });
      if (!record) return res.status(404).json({ error: "Membership not found" });

      await record.destroy();
      res.json({ success: true, message: "User removed from group" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};
