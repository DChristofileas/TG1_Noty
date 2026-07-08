// ==========================================
// NOTES ROUTES SECTION
// Every route in this file is protected by the
// JWT middleware before reaching the controller.
// ==========================================

const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");
const notesController = require("../controllers/notes.controller");

const router = express.Router();

router.use(authenticateToken);

router.get("/", notesController.getAllNotes);
router.get("/:id", notesController.getNoteById);
router.post("/", notesController.createNote);
router.put("/:id", notesController.updateNote);
router.delete("/:id", notesController.deleteNote);

module.exports = router;
