const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Role, Permission } = require("../models");
const generateAccessToken = user => jwt.sign({ id: user.id }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
const generateRefreshToken = user => jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

module.exports = {
register: async (req, res) => {
  
  console.log("req.body", req.body);

  try {
    const { first_name, middle_name, last_name, phone, email, password, created_by } = req.body;

    // Basic validation
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields: first_name, last_name, email, and password are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered. Please use a different email or login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      middle_name: middle_name || null,
      last_name,
      phone: phone || null,
      email,
      created_by: created_by || null,
      organization_id: null, // Individual users don't belong to an organization
      password: hashedPassword
    });

    // 🎯 Assign Tester role to individual users
    const testerRole = await Role.findOne({ where: { name: "tester" } });
    if (testerRole) {
      const db = require("../models");
      await db.UserRole.create({
        userId: user.id,
        roleId: testerRole.id
      });
      console.log("Tester role assigned to user:", user.id);
    } else {
      console.error("Tester role not found in database!");
      return res.status(500).json({ error: "System configuration error: Tester role not found" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Fetch user with roles and permissions
    const userData = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          include: [Permission]
        },
        Permission
      ]
    });

    // Safely extract permissions
    const rolePermissions = userData.Roles?.flatMap(r => 
      r.Permissions?.map(p => p.code) || []
    ) || [];
    
    const userPermissions = userData.Permissions?.map(p => p.code) || [];
    
    const effectivePermissions = [...new Set([...rolePermissions, ...userPermissions])];

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      organization_id: user.organization_id,
      roles: userData.Roles?.map(r => r.name) || [],
      permissions: effectivePermissions,
      accessToken,
      refreshToken
    });

  } catch (e) {
    console.error("Registration error:", e);
    
    // Handle Sequelize validation errors
    if (e.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: "Validation error: " + e.errors.map(err => err.message).join(', ')
      });
    }
    
    // Handle unique constraint errors
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        error: "Email already registered. Please use a different email."
      });
    }
    
    res.status(500).json({ error: e.message || "Registration failed" });
  }
},


login: async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          include: [Permission]  // <--- nested include
        },
        {
          model: Permission
        }
      ]
    });

    if (!user) return res.status(400).send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Invalid password");

    // Flatten all permissions safely
    const effectivePermissions = [
      ...new Set([
        ...(user.Roles?.flatMap(r => r.Permissions?.map(p => p.code) || []) || []),
        ...(user.Permissions?.map(p => p.code) || [])
      ])
    ];

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      id: user.id,
      email: user.email,
      organization_id: user.organization_id,
      roles: user.Roles.map(r => r.name),
      permissions: effectivePermissions,
      accessToken,
      refreshToken
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
},



  refreshToken: (req, res) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(401);
    try {
      const payload = jwt.verify(token, process.env.REFRESH_SECRET);
      res.json({ accessToken: generateAccessToken({ id: payload.id }) });
    } catch (e) { res.status(403).send("Invalid token"); }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).send("User not found");
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 3600000;
      await user.save();
      res.send("Reset link sent (simulate email)");
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const { Op } = require("sequelize");
      const user = await User.findOne({ where: { resetToken: token, resetTokenExpiry: { [Op.gt]: Date.now() } } });
      if (!user) return res.status(400).send("Invalid or expired token");
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      res.send("Password reset successful");
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};