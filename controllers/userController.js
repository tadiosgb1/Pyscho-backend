const { User, Role, Permission,Organization} = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = {
  async create(req, res) {
    try {
      const userData = { ...req.body };
      
      // Handle file uploads
      if (req.files) {
        if (req.files.photo) {
          userData.photo = `/uploads/${req.files.photo[0].filename}`;
        }
        if (req.files.cv) {
          userData.cv = `/uploads/${req.files.cv[0].filename}`;
        }
      }
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await User.create(userData);
      
      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      res.status(201).json(userResponse);
    } catch (e) {
      console.error('User creation error:', e);
      res.status(500).json({ error: e.message });
    }
  },

async getAll(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get current user's role and organization
    const currentUser = await User.findByPk(req.user.id, {
      include: [{ model: Role, attributes: ['name'], through: { attributes: [] } }]
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Current user not found" });
    }

    const userRoles = (currentUser.Roles || []).map(r => r.name);
    const isAdmin = userRoles.includes('admin');
    const isOrganization = userRoles.includes('organization');
    const organizationId = currentUser.organization_id;

    console.log('UserController.getAll:', { userId: req.user.id, userRoles, organizationId, isAdmin, isOrganization });

    let page = parseInt(req.query.page) || 1;
    let page_size = parseInt(req.query.page_size) || 10;
    let search = req.query.search || "";
    let ordering = req.query.ordering || "id";

    if (page < 1) page = 1;
    if (page_size < 1) page_size = 10;

    const searchConditions = search
      ? {
          [Op.or]: [
            { first_name: { [Op.like]: `%${search}%` } },
            { middle_name: { [Op.like]: `%${search}%` } },
            { last_name: { [Op.like]: `%${search}%` } },
            { phone_number: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { department: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    // 🔒 Role-based filtering
    let where = { ...searchConditions };
    
    if (isOrganization && organizationId) {
      // Organization sees only users in their organization
      where.organization_id = organizationId;
    } else if (!isAdmin) {
      // Tester sees only themselves
      where.id = req.user.id;
    }
    // Admin sees all users (no additional filter)

    const order = ordering.startsWith("-")
      ? [[ordering.slice(1), "DESC"]]
      : [[ordering, "ASC"]];

    const offset = (page - 1) * page_size;

    console.log('Fetching users with where:', where);

   const { rows, count } = await User.findAndCountAll({
  where,
  order,
  offset,
  limit: page_size,

  attributes: {
    exclude: ["password", "resetToken", "resetTokenExpiry"]
  },

  include: [
    {
      model: Organization,
      as: "organization",
      attributes: ["id", "name", "address", "official_email","official_phone"],
      required: false
    },
    {
      model: Role,
      attributes: ["id", "name"],
      through: { attributes: [] },
      required: false
    },
    {
      model: Permission,
      attributes: ["id", "code", "name"],
      through: { attributes: [] },
      required: false
    }
  ]
});

    console.log('Found users:', rows.length, 'Total count:', count);

    // Serialize the data to plain JSON
    const serializedData = rows.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        roles: userData.Roles || [],
        permissions: userData.Permissions || [],
        organization: userData.organization || null
      };
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
    const total_pages = Math.ceil(count / page_size);

    res.json({
      count,
      total_pages,
      current_page: page,
      next:
        page < total_pages
          ? `${baseUrl}?page=${page + 1}&page_size=${page_size}`
          : null,
      previous:
        page > 1
          ? `${baseUrl}?page=${page - 1}&page_size=${page_size}`
          : null,
      page_size,
      data: serializedData
    });

  } catch (e) {
    console.error('UserController.getAll error:', e);
    res.status(500).json({ error: e.message });
  }
}
,

  async getOne(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: {
          exclude: ["password", "resetToken", "resetTokenExpiry"]
        },
        include: [
          {
            model: Organization,
            as: "organization",
            attributes: ["id", "name", "address", "official_email", "official_phone"]
          },
          Role,
          Permission
        ]
      });
      
      if (!user) return res.status(404).json({ error: "Not found" });
      
      res.json(user);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async patch(req, res) { 
    try { 
      const user = await User.findByPk(req.params.id); 
      if (!user) return res.status(404).json({ error: "Not found" }); 
      
      const updateData = { ...req.body };
      
      // Handle file uploads
      if (req.files) {
        if (req.files.photo) {
          updateData.photo = `/uploads/${req.files.photo[0].filename}`;
        }
        if (req.files.cv) {
          updateData.cv = `/uploads/${req.files.cv[0].filename}`;
        }
      }
      
      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      Object.assign(user, updateData); 
      await user.save(); 
      
      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      res.json(userResponse); 
    } catch (e) { 
      console.error('User update error:', e);
      res.status(500).json({ error: e.message }); 
    } 
  },

  async update(req, res) { try { const [affected] = await User.update(req.body, { where: { id: req.params.id } }); if (!affected) return res.status(404).json({ error: "Not found" }); const updated = await User.findByPk(req.params.id, { include: [Role, Permission] }); res.json(updated); } catch (e) { res.status(500).json({ error: e.message }); } },

  async delete(req, res) { try { const deleted = await User.destroy({ where: { id: req.params.id } }); if (!deleted) return res.status(404).json({ error: "Not found" }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } },

  async assignRoles(req, res) { try { const user = await User.findByPk(req.params.id); const roles = await Role.findAll({ where: { id: req.body.roleIds } }); await user.setRoles(roles); res.send("Roles assigned"); } catch (e) { res.status(500).json({ error: e.message }); } },

  async assignPermissions(req, res) { try { const user = await User.findByPk(req.params.id); const permissions = await Permission.findAll({ where: { id: req.body.permissionIds } }); await user.setPermissions(permissions); res.send("Permissions assigned"); } catch (e) { res.status(500).json({ error: e.message }); } },

  async getEffectivePermissions(req, res) {
    try {
      const user = await User.findByPk(req.params.id, { include: [Role, Permission] });
      if (!user) return res.status(404).json({ error: "Not found" });
      const rolePermissions = user.Roles.flatMap(r => r.Permissions.map(p => p.code));
      const userPermissions = user.Permissions.map(p => p.code);
      const effectivePermissions = [...new Set([...rolePermissions, ...userPermissions])];
      res.json({ roles: user.Roles, permissions: effectivePermissions });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};