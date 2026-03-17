const bcrypt = require("bcryptjs");
const { User, Role, Permission } = require("../models");
const { generateAccessToken, generateRefreshToken } = require("../utility/token");

async function registerUser(payload) {
  const { first_name, middle_name, last_name, phone, email, password } = payload;

  // Basic validation
  if (!first_name || !last_name || !email || !password) {
    throw new Error("Missing required fields");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    first_name,
    middle_name,
    last_name,
    phone,
    email,
    password: hashedPassword,
  });

  // Optional: fetch roles/permissions
  const userData = await User.findByPk(user.id, { include: [Role, Permission] });
  const effectivePermissions = [
    ...new Set([
      ...userData.Roles.flatMap(r => r.Permissions.map(p => p.code)),
      ...userData.Permissions.map(p => p.code),
    ]),
  ];

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    id: user.id,
    email: user.email,
    roles: userData.Roles,
    permissions: effectivePermissions,
    accessToken,
    refreshToken,
  };
}

module.exports = { registerUser };
