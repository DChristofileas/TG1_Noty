// ==========================================
// JWT AUTHENTICATION SECTION
// This middleware verifies if the user has sent
// a valid token before accessing protected routes.
// ==========================================

const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Authentication token is required."
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({
        message: "Invalid or expired authentication token."
      });
    }

    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
