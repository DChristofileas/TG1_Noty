// ==========================================
// NOTES CRUD SECTION
// This section contains the logic to create,
// read, update and delete user notes.
// ==========================================

const db = require("../database/database");

function getAllNotes(req, res) {
  const sql = `
    SELECT id, title, content, user_id, created_at, updated_at
    FROM notes
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `;

  db.all(sql, [req.user.id], (error, notes) => {
    if (error) {
      return res.status(500).json({
        message: "Could not get notes."
      });
    }

    return res.json(notes);
  });
}

function getNoteById(req, res) {
  const sql = `
    SELECT id, title, content, user_id, created_at, updated_at
    FROM notes
    WHERE id = ? AND user_id = ?
  `;

  db.get(sql, [req.params.id, req.user.id], (error, note) => {
    if (error) {
      return res.status(500).json({
        message: "Could not get the note."
      });
    }

    if (!note) {
      return res.status(404).json({
        message: "Note not found."
      });
    }

    return res.json(note);
  });
}

function createNote(req, res) {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      message: "Title and content are required."
    });
  }

  const sql = "INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?)";

  db.run(sql, [title, content, req.user.id], function insertNote(error) {
    if (error) {
      return res.status(500).json({
        message: "Could not create the note."
      });
    }

    return res.status(201).json({
      message: "Note created successfully.",
      note: {
        id: this.lastID,
        title,
        content,
        user_id: req.user.id
      }
    });
  });
}

function updateNote(req, res) {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      message: "Title and content are required."
    });
  }

  const sql = `
    UPDATE notes
    SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `;

  db.run(sql, [title, content, req.params.id, req.user.id], function updateRow(error) {
    if (error) {
      return res.status(500).json({
        message: "Could not update the note."
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        message: "Note not found."
      });
    }

    return res.json({
      message: "Note updated successfully."
    });
  });
}

function deleteNote(req, res) {
  const sql = "DELETE FROM notes WHERE id = ? AND user_id = ?";

  db.run(sql, [req.params.id, req.user.id], function deleteRow(error) {
    if (error) {
      return res.status(500).json({
        message: "Could not delete the note."
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        message: "Note not found."
      });
    }

    return res.json({
      message: "Note deleted successfully."
    });
  });
}

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
};
