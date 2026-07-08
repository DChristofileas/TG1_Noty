// ==========================================
// SERVER CONFIGURATION SECTION
// This file starts the Express server and
// connects the main API routes used by Noty.
// ==========================================

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
require("./database/database");

const authRoutes = require("./routes/auth.routes");
const notesRoutes = require("./routes/notes.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// GLOBAL MIDDLEWARE SECTION
// Express reads JSON requests and CORS allows
// the frontend to communicate with this API.
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ==========================================
// API ROUTES SECTION
// Auth routes are public. Notes routes are
// protected inside their route file.
// ==========================================

app.get("/api", (req, res) => {
  res.json({
    message: "Noty API is running",
    documentation: "Use /api/auth and /api/notes endpoints."
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// ==========================================
// SERVER START SECTION
// This launches the backend on the configured
// port so the frontend can call the API.
// ==========================================

app.listen(PORT, () => {
  console.log(`Noty backend running at http://localhost:${PORT}`);
});
