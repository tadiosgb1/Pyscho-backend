const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Role, Permission } = require("../models");
const { Op } = require("sequelize");
const { sendPasswordResetEmail } = require("../utility/mailer");
const generateAccessToken = user => jwt.sign({ id: user.id }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
const generateRefreshToken = user => jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

module.exports = {
register: async (req, res) => {
  
  console.log("req.body", req.body);

  try {
    const userData = { ...req.body };

    // Basic validation
    if (!userData.first_name || !userData.last_name || !userData.email || !userData.password) {
      return res.status(400).json({ error: "Missing required fields: first_name, last_name, email, and password are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered. Please use a different email or login." });
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.photo) {
        userData.photo = `/uploads/${req.files.photo[0].filename}`;
      }
      if (req.files.cv) {
        userData.cv = `/uploads/${req.files.cv[0].filename}`;
      }
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await User.create({
      first_name: userData.first_name,
      middle_name: userData.middle_name || null,
      last_name: userData.last_name,
      phone_number: userData.phone_number || userData.phone || null,
      email: userData.email,
      date_of_birth: userData.date_of_birth || null,
      age: userData.age || null,
      department: userData.department || null,
      gender: userData.gender || null,
      photo: userData.photo || null,
      cv: userData.cv || null,
      created_by: userData.created_by || null,
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
    const userWithRoles = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          include: [Permission]
        },
        Permission
      ]
    });

    // Safely extract permissions
    const rolePermissions = userWithRoles.Roles?.flatMap(r => 
      r.Permissions?.map(p => p.code) || []
    ) || [];
    
    const userPermissions = userWithRoles.Permissions?.map(p => p.code) || [];
    const effectivePermissions = [...new Set([...rolePermissions, ...userPermissions])];
    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      organization_id: user.organization_id,
      roles: userWithRoles.Roles?.map(r => r.name) || [],
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

    // Check if the provided "email" is actually a phone number or email
    const isPhoneNumber = /^[\+]?[\d\s\-\(\)]+$/.test(email);
    
    let whereClause;
    if (isPhoneNumber) {
      // Search in both phone and phone_number fields for backward compatibility
      whereClause = {
        [Op.or]: [
          { phone: email },
          { phone_number: email }
        ]
      };
    } else {
      // It's an email
      whereClause = { email };
    }

    const user = await User.findOne({
      where: whereClause,
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

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

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
      first_name: user.first_name,
      last_name: user.last_name,
      organization_id: user.organization_id,
      roles: user.Roles?.map(r => r.name) || [],
      permissions: effectivePermissions,
      accessToken,
      refreshToken
    });

  } catch (e) {
    console.error("Login error:", e);
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

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await User.findOne({ where: { email } });

      // Always return success to prevent email enumeration attacks
      if (!user) {
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }

      // Generate secure token with 1-hour expiry
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 3600000;
      await user.save();

      // Build the reset link pointing to the frontend /reset/:token route
      const resetLink = `${process.env.FRONTEND_URL}/reset/${resetToken}`;

      // Send the real email via nodemailer
      await sendPasswordResetEmail(email, resetLink);

      console.log(`[ForgotPassword] Reset email sent to: ${email}`);
      return res.json({ message: "If that email exists, a reset link has been sent." });

    } catch (e) {
      console.error("[ForgotPassword] Error:", e.message);
      return res.status(500).json({ error: "Failed to send reset email. Please try again." });
    }
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
  },

  // Magic-link login — called when tester clicks the link in their assignment email
  // POST /api/auth/magic-login  { token }
  magicLogin: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: "Token is required" });

      const { Op } = require("sequelize");
      const user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: { [Op.gt]: Date.now() }
        },
        include: [{ model: Role, include: [Permission] }, Permission]
      });

      if (!user) return res.status(400).json({ error: "Invalid or expired login link" });

      // Invalidate the token immediately (one-time use)
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      const accessToken  = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const rolePermissions = user.Roles?.flatMap(r => r.Permissions?.map(p => p.code) || []) || [];
      const userPermissions = user.Permissions?.map(p => p.code) || [];
      const effectivePermissions = [...new Set([...rolePermissions, ...userPermissions])];

      res.json({
        id:              user.id,
        email:           user.email,
        first_name:      user.first_name,
        last_name:       user.last_name,
        organization_id: user.organization_id,
        roles:           user.Roles?.map(r => r.name) || [],
        permissions:     effectivePermissions,
        accessToken,
        refreshToken,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "currentPassword and newPassword are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }

      // req.user is set by authMiddleware
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};