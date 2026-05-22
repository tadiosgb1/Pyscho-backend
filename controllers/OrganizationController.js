const { Op } = require("sequelize");
const db = require("../models");
const Organization = db.Organization;
const bcrypt = require("bcrypt");
const User=db.User;
module.exports = {
  async getAll(req, res) {
    try {
      let page = parseInt(req.query.page) || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search = req.query.search || "";
      let ordering = req.query.ordering || "id";

      if (page < 1) page = 1;
      if (page_size < 1) page_size = 10;

      const searchableFields = ["name", "address", "official_email","official_phone"];
      const searchConditions = searchableFields.map(field => ({ [field]: { [Op.like]: "%" + search + "%" } }));
      const where = search ? { [Op.or]: searchConditions } : {};
      const order = ordering.startsWith("-") ? [[ordering.slice(1), "DESC"]] : [[ordering, "ASC"]];
      const offset = (page - 1) * page_size;

      const include = [].filter(Boolean);
      const findOptions = { where, order, offset, limit: page_size };
      if (include.length) findOptions.include = include;

      const { rows, count } = await Organization.findAndCountAll(findOptions);

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
      const include = [].filter(Boolean);
      const opts = include.length ? { include } : {};
      const data = await Organization.findByPk(req.params.id, opts);
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
      console.log('=== ORGANIZATION CREATE DEBUG ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      let user, organization;
      
      // Support both nested and flat formats
      if (req.body.user && req.body.organization) {
        // Nested format: { user: {...}, organization: {...} }
        user = req.body.user;
        organization = req.body.organization;
      } else {
        // Flat format: all fields at root level
        // This happens when the payload is being flattened somewhere
        user = {
          first_name: req.body.first_name,
          middle_name: req.body.middle_name,
          last_name: req.body.last_name,
          email: req.body.email,
          phone: req.body.phone,
          password: req.body.password,
        };
        organization = {
          name: req.body.name || req.body.org_name,
          official_email: req.body.official_email || req.body.org_email,
          official_phone: req.body.official_phone || req.body.org_phone,
          address: req.body.address,
          org_type: req.body.org_type,
          description: req.body.description,
        };
      }
      
      console.log('User object:', user);
      console.log('Organization object:', organization);

      // Validate user fields
      if (!user || !user.email || !user.password || !user.first_name || !user.last_name) {
        return res.status(400).json({ 
          error: "Missing required user fields",
          details: {
            hasUser: !!user,
            hasEmail: !!user?.email,
            hasPassword: !!user?.password,
            hasFirstName: !!user?.first_name,
            hasLastName: !!user?.last_name
          }
        });
      }

      // Validate organization fields
      if (!organization || !organization.name) {
        return res.status(400).json({ 
          error: "Missing required organization fields",
          details: {
            hasOrganization: !!organization,
            hasName: !!organization?.name
          }
        });
      }

      // 🔒 Check if user email already exists
      const existingUser = await User.findOne({
        where: { email: user.email },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // 1️⃣ Create Organization
      const org = await Organization.create({
        name: organization.name,
        official_email: organization.official_email,
        official_phone: organization.official_phone,
        org_type: organization.org_type,
        description: organization.description,
        address: organization.address
      });

      console.log("Organization created:", org.id);

      // 2️⃣ Hash Password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // 3️⃣ Create User (Admin of Org)
      const newUser = await User.create({
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        password: hashedPassword,
        organization_id: org.id, // ✅ LINK
        created_by: null, // first user
      });

      console.log("User created:", newUser.id);

      // 4️⃣ Assign Organization Role (id=5 based on your DB)
      const orgRole = await db.Role.findOne({ where: { name: "organization" } });
      if (orgRole) {
        await db.UserRole.create({
          userId: newUser.id,
          roleId: orgRole.id
        });
        console.log("Organization role assigned:", orgRole.id);
      } else {
        console.error("Organization role not found in database!");
      }

      console.log('=== END DEBUG ===');

      // ✅ Response
      return res.json({
        message: "Organization and admin user created successfully",
        organization: org,
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          organization_id: newUser.organization_id
        },
      });

    } catch (e) {
      console.error('Organization create error:', e);
      return res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const body = { ...req.body };
      
      await Organization.update(body, { where: { id: req.params.id } });
      const updated = await Organization.findByPk(req.params.id);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async delete(req, res) {
    try {
      await Organization.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};
