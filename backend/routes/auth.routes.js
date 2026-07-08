// ==========================================
// AUTH ROUTES SECTION
// These public routes allow users to register
// and log in to receive a JWT token.
// ==========================================

const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
