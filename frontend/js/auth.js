// ==========================================
// AUTHENTICATION UI SECTION
// This file connects the login and register
// forms with the backend authentication API.
// ==========================================

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const messageElement = document.querySelector("#message");

function showMessage(text, type = "info") {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`;
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      saveToken(data.token);
      saveUser(data.user);
      window.location.href = "dashboard.html";
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      showMessage("Account created. Redirecting to login...", "success");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}
