const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_SECRET,
    { expiresIn: "15m" } // 15 minutes
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" } // 7 days
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
