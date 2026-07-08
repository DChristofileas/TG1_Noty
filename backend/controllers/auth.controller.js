// ==========================================
// AUTH CONTROLLER SECTION
// This file contains the register and login
// logic used by the authentication routes.
// ==========================================

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/database");

function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required."
    });
  }

  bcrypt.hash(password, 10, (hashError, hashedPassword) => {
    if (hashError) {
      return res.status(500).json({
        message: "Could not encrypt the password."
      });
    }

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.run(sql, [name, email, hashedPassword], function insertUser(error) {
      if (error) {
        if (error.message.includes("UNIQUE")) {
          return res.status(409).json({
            message: "A user with this email already exists."
          });
        }

        return res.status(500).json({
          message: "Could not create the user."
        });
      }

      return res.status(201).json({
        message: "User registered successfully.",
        user: {
          id: this.lastID,
          name,
          email
        }
      });
    });
  });
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required."
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.get(sql, [email], (error, user) => {
    if (error) {
      return res.status(500).json({
        message: "Could not search for the user."
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    bcrypt.compare(password, user.password, (compareError, isValidPassword) => {
      if (compareError) {
        return res.status(500).json({
          message: "Could not validate the password."
        });
      }

      if (!isValidPassword) {
        return res.status(401).json({
          message: "Invalid email or password."
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return res.json({
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    });
  });
}

module.exports = {
  register,
  login
};
