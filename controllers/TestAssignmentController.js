const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const db = require("../models");
const TestAssignment = db.TestAssignment;
const { sendTestAssignmentEmail } = require("../utility/mailer");

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatEmailDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Generate a readable temporary password, hash it, save it on the user,
 * and return the plain-text version to include in the email.
 * Format: GYZ-XXXX-XXXX  (easy to type, hard to guess)
 */
async function setTempPassword(user) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const plain = `GYZ-${seg()}-${seg()}`;
  user.password = await bcrypt.hash(plain, 10);
  await user.save();
  return plain;
}

/**
 * Derive a unique username from first + last name.
 * e.g. Sara Tesfaye → sara.tesfaye  (appends a number if taken)
 */
async function ensureUsername(user) {
  if (user.username) return user.username; // already has one

  const base = `${user.first_name}.${user.last_name}`
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, ''); // strip special chars

  let candidate = base;
  let suffix = 1;
  while (true) {
    const taken = await db.User.findOne({ where: { username: candidate } });
    if (!taken || taken.id === user.id) break;
    candidate = `${base}${suffix++}`;
  }

  user.username = candidate;
  await user.save();
  return candidate;
}

/**
 * Send assignment email to a single user.
 * Generates a temporary password + username, saves them, and emails credentials + test info.
 */
async function notifyUser(user, test, assignment) {
  try {
    const [tempPassword, username] = await Promise.all([
      setTempPassword(user),
      ensureUsername(user),
    ]);
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    await sendTestAssignmentEmail({
      toEmail:      user.email,
      firstName:    user.first_name,
      testTitle:    test.title,
      testDuration: test.duration || "Not specified",
      dueDate:      formatEmailDate(assignment.due_date),
      notes:        assignment.notes || null,
      loginUrl,
      userEmail:    user.email,
      username,
      tempPassword,
    });
    console.log(`[TestAssignment] Notification sent to ${user.email} (username: ${username})`);
  } catch (e) {
    console.error(`[TestAssignment] Failed to notify ${user.email}:`, e.message);
  }
}

/**
 * Resolve the display name for the assignee (user or group).
 */
async function resolveAssignee(type, id) {
  try {
    if (type === "user") {
      const u = await db.User.findByPk(id, { attributes: ["id", "first_name", "last_name", "email"] });
      if (!u) return null;
      return { id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email };
    }
    if (type === "group") {
      const g = await db.Group.findByPk(id, { attributes: ["id", "name", "description"] });
      if (!g) return null;
      return { id: g.id, name: g.name };
    }
  } catch (_) {}
  return null;
}

// ─── Controller ─────────────────────────────────────────────────────────────

module.exports = {

  // GET /api/test-assignments
  async getAll(req, res) {
    try {
      // Get current user's role and organization
      const currentUser = await db.User.findByPk(req.user.id, {
        include: [{ model: db.Role, attributes: ['name'] }]
      });

      const userRoles = currentUser.Roles.map(r => r.name);
      const isAdmin = userRoles.includes('admin');
      const isOrganization = userRoles.includes('organization');
      const isTester = userRoles.includes('tester');
      const organizationId = currentUser.organization_id;

      console.log('TestAssignmentController.getAll:', { userId: req.user.id, userRoles, organizationId });

      let page      = parseInt(req.query.page)      || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      if (page < 1)      page      = 1;
      if (page_size < 1) page_size = 10;

      const where = {};

      // Optional filters
      if (req.query.test_id)          where.test_id          = parseInt(req.query.test_id);
      if (req.query.assigned_to_type) where.assigned_to_type = req.query.assigned_to_type;
      if (req.query.assigned_to_id)   where.assigned_to_id   = parseInt(req.query.assigned_to_id);
      if (req.query.assigned_by)      where.assigned_by      = parseInt(req.query.assigned_by);
      if (req.query.status)           where.status           = req.query.status;

      // 🔒 Role-based filtering
      if (isOrganization && organizationId) {
        // Organization sees assignments for users in their organization
        const orgUsers = await db.User.findAll({
          where: { organization_id: organizationId },
          attributes: ['id']
        });
        const orgUserIds = orgUsers.map(u => u.id);

        // Also get groups belonging to this organization
        const orgGroups = await db.Group.findAll({
          where: { _id: organizationId },
          attributes: ['id']
        });
        const orgGroupIds = orgGroups.map(g => g.id);

        // Filter assignments to org users or org groups
        where[Op.or] = [
          { assigned_to_type: 'user', assigned_to_id: { [Op.in]: orgUserIds.length ? orgUserIds : [0] } },
          { assigned_to_type: 'group', assigned_to_id: { [Op.in]: orgGroupIds.length ? orgGroupIds : [0] } }
        ];

      } else if (isTester && !isAdmin) {
        // Tester sees only assignments to themselves or their groups
        const userGroups = await db.UserGroup.findAll({
          where: { userId: req.user.id },
          attributes: ['groupId']
        });
        const groupIds = userGroups.map(ug => ug.groupId);

        where[Op.or] = [
          { assigned_to_type: 'user', assigned_to_id: req.user.id },
          { assigned_to_type: 'group', assigned_to_id: { [Op.in]: groupIds.length ? groupIds : [0] } }
        ];
      }
      // Admin sees all assignments (no additional filter)

      const offset = (page - 1) * page_size;

      const { rows, count } = await TestAssignment.findAndCountAll({
        where,
        offset,
        limit: page_size,
        order: [["createdAt", "DESC"]],
        include: [
          { model: db.Test, as: "test",     attributes: ["id", "title", "description", "duration"] },
          { model: db.User, as: "assigner", attributes: ["id", "first_name", "last_name", "email"] },
        ],
      });

      // Attach resolved assignee info (user or group)
      const data = await Promise.all(
        rows.map(async (row) => {
          const obj = row.toJSON();
          obj.assignee = await resolveAssignee(obj.assigned_to_type, obj.assigned_to_id);
          return obj;
        })
      );

      const total_pages = Math.ceil(count / page_size);
      const baseUrl     = `${req.protocol}://${req.get("host")}${req.path}`;

      res.json({
        count,
        total_pages,
        current_page: page,
        next:     page < total_pages ? `${baseUrl}?page=${page + 1}&page_size=${page_size}` : null,
        previous: page > 1           ? `${baseUrl}?page=${page - 1}&page_size=${page_size}` : null,
        page_size,
        data,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/test-assignments/:id
  async getOne(req, res) {
    try {
      const record = await TestAssignment.findByPk(req.params.id, {
        include: [
          { model: db.Test, as: "test",     attributes: ["id", "title", "description", "duration"] },
          { model: db.User, as: "assigner", attributes: ["id", "first_name", "last_name", "email"] },
        ],
      });
      if (!record) return res.status(404).json({ error: "Assignment not found" });

      const obj = record.toJSON();
      obj.assignee = await resolveAssignee(obj.assigned_to_type, obj.assigned_to_id);

      res.json(obj);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/test-assignments/user/:userId
  // All test assignments for a specific user (direct + via groups)
  async getForUser(req, res) {
    try {
      const userId = parseInt(req.params.userId);

      // 1. Direct user assignments
      const directAssignments = await TestAssignment.findAll({
        where: { assigned_to_type: "user", assigned_to_id: userId },
        include: [{ model: db.Test, as: "test", attributes: ["id", "title", "description", "duration"] }],
      });

      // 2. Group assignments — find all groups this user belongs to
      const userGroups = await db.UserGroup.findAll({ where: { userId } });
      const groupIds   = userGroups.map(ug => ug.groupId);

      let groupAssignments = [];
      if (groupIds.length > 0) {
        groupAssignments = await TestAssignment.findAll({
          where: { assigned_to_type: "group", assigned_to_id: { [Op.in]: groupIds } },
          include: [{ model: db.Test, as: "test", attributes: ["id", "title", "description", "duration"] }],
        });
      }

      // Merge and deduplicate by test_id
      const seen    = new Set();
      const merged  = [];
      for (const a of [...directAssignments, ...groupAssignments]) {
        const obj = a.toJSON();
        if (!seen.has(obj.test_id)) {
          seen.add(obj.test_id);
          merged.push(obj);
        }
      }

      res.json({ count: merged.length, data: merged });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/test-assignments/group/:groupId
  // All test assignments for a specific group
  async getForGroup(req, res) {
    try {
      const records = await TestAssignment.findAll({
        where: { assigned_to_type: "group", assigned_to_id: parseInt(req.params.groupId) },
        include: [
          { model: db.Test, as: "test",     attributes: ["id", "title", "description", "duration"] },
          { model: db.User, as: "assigner", attributes: ["id", "first_name", "last_name", "email"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json({ count: records.length, data: records.map(r => r.toJSON()) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/test-assignments
  // Assign a test to a user or group
  // Body: { test_id, assigned_to_type, assigned_to_id, due_date?, notes? }
  async create(req, res) {
    try {
      const { test_id, assigned_to_type, assigned_to_id, due_date, notes } = req.body;
      const assigned_by = req.user?.id || parseInt(req.body.assigned_by);

      // Validate required fields
      if (!test_id || !assigned_to_type || !assigned_to_id) {
        return res.status(400).json({
          error: "test_id, assigned_to_type, and assigned_to_id are required",
        });
      }

      if (!["user", "group"].includes(assigned_to_type)) {
        return res.status(400).json({ error: "assigned_to_type must be 'user' or 'group'" });
      }

      // Verify test exists
      const test = await db.Test.findByPk(test_id);
      if (!test) return res.status(404).json({ error: "Test not found" });

      // Verify assignee exists
      const assignee = await resolveAssignee(assigned_to_type, assigned_to_id);
      if (!assignee) {
        return res.status(404).json({
          error: `${assigned_to_type === "user" ? "User" : "Group"} not found`,
        });
      }

      // Prevent duplicate active assignment
      const existing = await TestAssignment.findOne({
        where: {
          test_id,
          assigned_to_type,
          assigned_to_id,
          status: { [Op.in]: ["pending", "in_progress"] },
        },
      });
      if (existing) {
        return res.status(409).json({
          error: `This test is already assigned to this ${assigned_to_type} and is still active`,
        });
      }

      const record = await TestAssignment.create({
        test_id,
        assigned_to_type,
        assigned_to_id,
        assigned_by,
        due_date: due_date || null,
        notes:    notes    || null,
        status:   "pending",
      });

      // ── Send notification email ──────────────────────────────────────────
      // Fire-and-forget: don't block the response on email delivery
      if (assigned_to_type === "user") {
        const user = await db.User.findByPk(assigned_to_id);
        if (user && user.email) {
          notifyUser(user, test, { due_date, notes });
        }
      } else if (assigned_to_type === "group") {
        // Notify every member of the group
        const memberships = await db.UserGroup.findAll({
          where: { groupId: assigned_to_id },
          include: [{ model: db.User, as: "user", attributes: ["id", "first_name", "last_name", "email"] }],
        });
        for (const m of memberships) {
          if (m.user && m.user.email) {
            notifyUser(m.user, test, { due_date, notes });
          }
        }
      }

      // Return with full details
      const result = await TestAssignment.findByPk(record.id, {
        include: [
          { model: db.Test, as: "test",     attributes: ["id", "title", "description", "duration"] },
          { model: db.User, as: "assigner", attributes: ["id", "first_name", "last_name", "email"] },
        ],
      });
      const obj    = result.toJSON();
      obj.assignee = assignee;

      res.status(201).json(obj);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/test-assignments/bulk
  // Assign a test to multiple users and/or groups at once
  // Body: { test_id, assignments: [{ type: "user"|"group", id }], due_date?, notes? }
  async bulkCreate(req, res) {
    try {
      const { test_id, assignments, due_date, notes } = req.body;
      const assigned_by = req.user?.id || parseInt(req.body.assigned_by);

      if (!test_id || !Array.isArray(assignments) || assignments.length === 0) {
        return res.status(400).json({ error: "test_id and a non-empty assignments array are required" });
      }

      const test = await db.Test.findByPk(test_id);
      if (!test) return res.status(404).json({ error: "Test not found" });

      const created = [];
      const skipped = [];

      for (const a of assignments) {
        const { type, id } = a;
        if (!["user", "group"].includes(type) || !id) {
          skipped.push({ type, id, reason: "Invalid type or missing id" });
          continue;
        }

        const existing = await TestAssignment.findOne({
          where: {
            test_id,
            assigned_to_type: type,
            assigned_to_id:   id,
            status: { [Op.in]: ["pending", "in_progress"] },
          },
        });

        if (existing) {
          skipped.push({ type, id, reason: "Already assigned and active" });
          continue;
        }

        const record = await TestAssignment.create({
          test_id,
          assigned_to_type: type,
          assigned_to_id:   id,
          assigned_by,
          due_date: due_date || null,
          notes:    notes    || null,
          status:   "pending",
        });
        created.push(record.id);

        // ── Send notification email ────────────────────────────────────────
        if (type === "user") {
          const user = await db.User.findByPk(id);
          if (user && user.email) {
            notifyUser(user, test, { due_date, notes });
          }
        } else if (type === "group") {
          const memberships = await db.UserGroup.findAll({
            where: { groupId: id },
            include: [{ model: db.User, as: "user", attributes: ["id", "first_name", "last_name", "email"] }],
          });
          for (const m of memberships) {
            if (m.user && m.user.email) {
              notifyUser(m.user, test, { due_date, notes });
            }
          }
        }
      }

      res.status(201).json({
        message: `${created.length} assignment(s) created`,
        created,
        skipped,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // PATCH /api/test-assignments/:id/status
  // Update assignment status: pending | in_progress | completed | expired
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const validStatuses = ["pending", "in_progress", "completed", "expired"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
      }

      const record = await TestAssignment.findByPk(req.params.id);
      if (!record) return res.status(404).json({ error: "Assignment not found" });

      await record.update({ status });
      res.json({ success: true, id: record.id, status: record.status });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // DELETE /api/test-assignments/:id
  async delete(req, res) {
    try {
      const record = await TestAssignment.findByPk(req.params.id);
      if (!record) return res.status(404).json({ error: "Assignment not found" });

      await record.destroy();
      res.json({ success: true, message: "Assignment removed" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
