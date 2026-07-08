// ==========================================
// NOTES INTERFACE SECTION
// This file controls the dashboard, editor,
// CRUD actions and PDF export for Noty.
// ==========================================

const notesList = document.querySelector("#notesList");
const searchInput = document.querySelector("#searchInput");
const noteTitle = document.querySelector("#noteTitle");
const noteEditor = document.querySelector("#noteEditor");
const messageElement = document.querySelector("#message");
const newNoteButton = document.querySelector("#newNoteButton");
const saveNoteButton = document.querySelector("#saveNoteButton");
const deleteNoteButton = document.querySelector("#deleteNoteButton");
const exportPdfButton = document.querySelector("#exportPdfButton");
const logoutButton = document.querySelector("#logoutButton");
const toolbar = document.querySelector(".toolbar");
const toolbarButtons = Array.from(toolbar.querySelectorAll("button"));

const DISCARD_CHANGES_MESSAGE = "Tienes cambios sin guardar. Si continúas, se perderán.";
const EDITOR_PLACEHOLDER_TEXTS = ["Escribe tu nota aquí...", "Escribe tu nota aqui..."];
const NOTE_DATE_FORMATTER = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Costa_Rica"
});
const SQLITE_UTC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

let notes = [];
let selectedNoteId = null;
let hasUnsavedChanges = false;

window.NotyNotes = {
  saveNote: () => saveNote(),
  deleteNote: () => deleteNote(),
  exportNoteToPdf: () => exportNoteToPdf()
};

function showMessage(text, type = "info") {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`;
}

function protectDashboard() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }

  return true;
}

function getEditorPlainText() {
  return noteEditor.textContent.replace(/\u00a0/g, " ").trim();
}

function hasUsefulContent() {
  const text = getEditorPlainText();
  return Boolean(text && !EDITOR_PLACEHOLDER_TEXTS.includes(text));
}

function hasUsefulTitle() {
  return Boolean(noteTitle.value.trim());
}

function updateActionButtons() {
  deleteNoteButton.disabled = selectedNoteId === null;
  saveNoteButton.disabled = !hasUsefulTitle() || !hasUsefulContent();
  exportPdfButton.disabled = !hasUsefulTitle() || !hasUsefulContent();
}

function markUnsavedChanges() {
  if (!hasUnsavedChanges) {
    hasUnsavedChanges = true;
    showMessage("Tienes cambios sin guardar.", "info");
  }

  updateActionButtons();
}

function clearUnsavedChanges() {
  hasUnsavedChanges = false;
  updateActionButtons();
}

function confirmDiscardChanges() {
  if (!hasUnsavedChanges) {
    return true;
  }

  return window.confirm(DISCARD_CHANGES_MESSAGE);
}

function createEmptyState(message, hint = "") {
  const container = document.createElement("div");
  container.className = "empty-state";

  const text = document.createElement("p");
  text.textContent = message;
  container.appendChild(text);

  if (hint) {
    const detail = document.createElement("small");
    detail.textContent = hint;
    container.appendChild(detail);
  }

  return container;
}

function parseNoteDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  if (typeof dateValue === "string" && SQLITE_UTC_DATE_PATTERN.test(dateValue)) {
    return new Date(`${dateValue.replace(" ", "T")}Z`);
  }

  return new Date(dateValue);
}

function formatNoteDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const date = parseNoteDate(dateValue);

  if (!date || Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return NOTE_DATE_FORMATTER.format(date);
}

function getSearchTerm() {
  return searchInput.value.trim().toLowerCase();
}

function getPlainTextFromHtml(html) {
  const container = document.createElement("div");
  container.innerHTML = html || "";
  return container.textContent.toLowerCase();
}

function getFilteredNotes() {
  const searchTerm = getSearchTerm();

  if (!searchTerm) {
    return notes;
  }

  return notes.filter((note) => {
    const title = (note.title || "").toLowerCase();
    const content = getPlainTextFromHtml(note.content);
    return title.includes(searchTerm) || content.includes(searchTerm);
  });
}

function renderNotesList() {
  notesList.innerHTML = "";

  if (notes.length === 0) {
    notesList.appendChild(createEmptyState(
      "No tienes notas todavía. Crea tu primera nota para empezar.",
      "Usa el botón Nueva nota como acción principal."
    ));
    return;
  }

  const visibleNotes = getFilteredNotes();

  if (visibleNotes.length === 0) {
    notesList.appendChild(createEmptyState("No encontramos notas con ese texto."));
    return;
  }

  visibleNotes.forEach((note) => {
    const button = document.createElement("button");
    button.className = note.id === selectedNoteId ? "note-item active" : "note-item";
    button.type = "button";
    button.setAttribute("aria-label", `Abrir nota ${note.title}`);
    button.setAttribute("aria-pressed", String(note.id === selectedNoteId));

    const title = document.createElement("strong");
    title.textContent = note.title;

    const date = document.createElement("span");
    date.textContent = formatNoteDate(note.updated_at);

    button.append(title, date);
    button.addEventListener("click", () => selectNote(note));
    notesList.appendChild(button);
  });
}

function setEditor(note) {
  selectedNoteId = note ? note.id : null;
  noteTitle.value = note ? note.title : "";
  noteEditor.innerHTML = note ? note.content : "";
  clearUnsavedChanges();
  renderNotesList();
  updateToolbarState();
}

function startNewNote() {
  if (!confirmDiscardChanges()) {
    return;
  }

  setEditor(null);
  noteTitle.focus();
  showMessage("Nueva nota lista. Escribe un título para empezar.", "info");
}

function selectNote(note) {
  if (note.id === selectedNoteId) {
    return;
  }

  if (!confirmDiscardChanges()) {
    return;
  }

  setEditor(note);
  showMessage("Nota cargada.", "success");
}

function getSelectionElement() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  let node = selection.anchorNode;

  if (node && node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  return node instanceof Element ? node : null;
}

function isSelectionInsideEditor() {
  const element = getSelectionElement();
  return Boolean(element && (element === noteEditor || noteEditor.contains(element)));
}

function getCurrentBlockTag() {
  let element = getSelectionElement();

  while (element && element !== noteEditor) {
    const tagName = element.tagName.toLowerCase();

    if (["h1", "h2", "h3", "p", "li"].includes(tagName)) {
      return tagName;
    }

    element = element.parentElement;
  }

  return "p";
}

function isSelectionInsideTag(tagName) {
  let element = getSelectionElement();

  while (element && element !== noteEditor) {
    if (element.tagName.toLowerCase() === tagName) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

function queryCommandState(command) {
  try {
    return document.queryCommandState(command);
  } catch (error) {
    return false;
  }
}

function isToolbarButtonActive(button, currentBlockTag) {
  const command = button.dataset.command;
  const value = button.dataset.value;

  if (command === "formatBlock") {
    return value === currentBlockTag;
  }

  if (command === "insertUnorderedList") {
    return queryCommandState(command) || isSelectionInsideTag("ul");
  }

  if (command === "insertOrderedList") {
    return queryCommandState(command) || isSelectionInsideTag("ol");
  }

  return queryCommandState(command);
}

function updateToolbarState() {
  if (!isSelectionInsideEditor()) {
    toolbarButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
    return;
  }

  const currentBlockTag = getCurrentBlockTag();

  toolbarButtons.forEach((button) => {
    const isActive = isToolbarButtonActive(button, currentBlockTag);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

async function loadNotes(preferredNoteId = selectedNoteId) {
  try {
    notes = await apiRequest("/notes");

    if (preferredNoteId !== null) {
      const currentNote = notes.find((note) => note.id === preferredNoteId);

      if (currentNote) {
        setEditor(currentNote);
        return;
      }
    }

    setEditor(notes[0] || null);
  } catch (error) {
    showMessage(error.message, "error");
    updateActionButtons();
  }
}

function getCurrentNoteData() {
  return {
    title: noteTitle.value.trim(),
    content: noteEditor.innerHTML.trim()
  };
}

function validateNoteData(title) {
  if (!title) {
    showMessage("Escribe un título antes de guardar.", "error");
    noteTitle.focus();
    return false;
  }

  if (!hasUsefulContent()) {
    showMessage("Escribe contenido real antes de guardar.", "error");
    noteEditor.focus();
    return false;
  }

  return true;
}

async function saveNote() {
  const { title, content } = getCurrentNoteData();

  if (!validateNoteData(title)) {
    updateActionButtons();
    return;
  }

  showMessage("Guardando nota...", "info");

  try {
    if (selectedNoteId) {
      await apiRequest(`/notes/${selectedNoteId}`, {
        method: "PUT",
        body: JSON.stringify({ title, content })
      });
      showMessage("Nota actualizada correctamente.", "success");
    } else {
      const data = await apiRequest("/notes", {
        method: "POST",
        body: JSON.stringify({ title, content })
      });
      selectedNoteId = data.note.id;
      showMessage("Nota creada correctamente.", "success");
    }

    clearUnsavedChanges();
    await loadNotes(selectedNoteId);
  } catch (error) {
    showMessage(error.message, "error");
    updateActionButtons();
  }
}

async function deleteNote() {
  if (!selectedNoteId) {
    showMessage("Selecciona una nota antes de eliminar.", "error");
    updateActionButtons();
    return;
  }

  const confirmed = window.confirm("¿Quieres eliminar esta nota?");

  if (!confirmed) {
    return;
  }

  try {
    const deletedNoteId = selectedNoteId;
    await apiRequest(`/notes/${deletedNoteId}`, {
      method: "DELETE"
    });

    showMessage("Nota eliminada correctamente.", "success");
    clearUnsavedChanges();
    await loadNotes(null);
  } catch (error) {
    showMessage(error.message, "error");
    updateActionButtons();
  }
}

function applyFormat(command, value = null) {
  if (command === "formatBlock" && value === "p") {
    if (queryCommandState("insertUnorderedList")) {
      document.execCommand("insertUnorderedList", false, null);
    }

    if (queryCommandState("insertOrderedList")) {
      document.execCommand("insertOrderedList", false, null);
    }
  }

  document.execCommand(command, false, value);
  noteEditor.focus();
  markUnsavedChanges();
  updateToolbarState();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// PDF EXPORT SECTION
// This function converts the selected note
// into a printable document.
// ==========================================

function exportNoteToPdf() {
  const title = noteTitle.value.trim();

  if (!title) {
    showMessage("Escribe un título antes de exportar.", "error");
    noteTitle.focus();
    return;
  }

  if (!hasUsefulContent()) {
    showMessage("Escribe contenido real antes de exportar.", "error");
    noteEditor.focus();
    return;
  }

  const pdfContent = document.createElement("article");
  pdfContent.className = "pdf-note";

  const heading = document.createElement("h1");
  heading.textContent = title;

  const content = document.createElement("div");
  content.innerHTML = noteEditor.innerHTML;

  pdfContent.append(heading, content);

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    showMessage("El navegador bloqueó la ventana de impresión.", "error");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 32px; }
      </style>
    </head>
    <body>${pdfContent.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  showMessage("Usa Guardar como PDF en la ventana de impresión.", "success");
}

function handleLogout() {
  if (!confirmDiscardChanges()) {
    return;
  }

  removeToken();
  window.location.href = "login.html";
}

function handleKeyboardShortcuts(event) {
  const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";

  if (!isSaveShortcut) {
    return;
  }

  event.preventDefault();
  saveNote();
}

function handleBeforeUnload(event) {
  if (!hasUnsavedChanges) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
}

function bindEvents() {
  toolbar.addEventListener("mousedown", (event) => {
    if (event.target.closest("button")) {
      event.preventDefault();
    }
  });

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    applyFormat(button.dataset.command, button.dataset.value || null);
  });

  searchInput.addEventListener("input", renderNotesList);
  noteTitle.addEventListener("input", markUnsavedChanges);
  noteEditor.addEventListener("input", () => {
    markUnsavedChanges();
    updateToolbarState();
  });
  noteEditor.addEventListener("keyup", updateToolbarState);
  noteEditor.addEventListener("mouseup", updateToolbarState);
  newNoteButton.addEventListener("click", startNewNote);
  saveNoteButton.addEventListener("click", saveNote);
  deleteNoteButton.addEventListener("click", deleteNote);
  exportPdfButton.addEventListener("click", exportNoteToPdf);
  logoutButton.addEventListener("click", handleLogout);
  document.addEventListener("keydown", handleKeyboardShortcuts);
  document.addEventListener("selectionchange", updateToolbarState);
  window.addEventListener("beforeunload", handleBeforeUnload);
}

function initDashboard() {
  if (!protectDashboard()) {
    return;
  }

  bindEvents();
  updateActionButtons();
  showMessage("Editor listo.", "success");
  loadNotes();
}

initDashboard();
