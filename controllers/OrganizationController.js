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
      const { user, organization } = req.body;

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
        address:organization.address
      });


      console.log("org",org);
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

      // 4️⃣ Assign Admin Role (optional but recommended)
      // const adminRole = await Role.findOne({ where: { name: "Admin" } });

      // if (adminRole) {
      //   await newUser.addRole(adminRole);
      // }

      // ✅ Response
      return res.json({
        message: "Organization and admin user created successfully",
        organization: org,
        user: newUser,
      });

    } catch (e) {
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
