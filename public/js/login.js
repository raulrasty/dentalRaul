/* =============================================
   DENTALRAÚL — login.js
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {

  const loginForm    = document.getElementById("login-form");
  const registroForm = document.getElementById("registro-form");
  const showRegistro = document.getElementById("show-registro");
  const showLogin    = document.getElementById("show-login");
  const toggleRegistro = document.getElementById("toggle-registro");
  const errorMsg     = document.getElementById("error-msg");
  const successMsg   = document.getElementById("success-msg");

  // Toggle login/registro
  showRegistro.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    registroForm.classList.remove("hidden");
    document.querySelector(".form-divider").classList.add("hidden");
    toggleRegistro.classList.remove("hidden");
    document.querySelector("h2").textContent = "Crear cuenta";
    document.querySelector(".form-subtitle").textContent = "Rellena los datos para registrarte";
    hideAlerts();
  });

  showLogin.addEventListener("click", () => {
    registroForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    toggleRegistro.classList.add("hidden");
    document.querySelector(".form-divider").classList.remove("hidden");
    document.querySelector("h2").textContent = "Bienvenido";
    document.querySelector(".form-subtitle").textContent = "Introduce tus credenciales para acceder";
    hideAlerts();
  });

  // Mostrar/ocultar contraseña
  document.getElementById("toggle-password").addEventListener("click", () => {
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
  });

  // Login normal
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlerts();
    setBtnLoading(true);

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${CONFIG.API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = "/dashboard.html";
    } catch (err) {
      showMsg(errorMsg, err.message || "Error al iniciar sesión");
    } finally {
      setBtnLoading(false);
    }
  });

  // Botón invitado
  document.getElementById("btn-invitado").addEventListener("click", async () => {
    hideAlerts();
    const btn = document.getElementById("btn-invitado");
    btn.disabled = true;
    btn.querySelector("span").textContent = "Entrando...";

    try {
      const res = await fetch(`${CONFIG.API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email:    "invitado@dentalraul.com",
          password: "invitado1234"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error("No se pudo entrar como invitado");
      window.location.href = "/dashboard.html";
    } catch (err) {
      showMsg(errorMsg, err.message);
      btn.disabled = false;
      btn.querySelector("span").textContent = "Entrar como invitado";
    }
  });

  // Registro
  registroForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlerts();
    const nombre   = document.getElementById("reg-nombre").value.trim();
    const email    = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (password.length < 6) {
      showMsg(errorMsg, "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      const res = await fetch(`${CONFIG.API_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMsg(successMsg, "Cuenta creada. Revisa tu email para confirmar.");
      registroForm.reset();
    } catch (err) {
      showMsg(errorMsg, err.message || "Error al registrar");
    }
  });

  function showMsg(el, texto) {
    el.textContent = texto;
    el.classList.remove("hidden");
  }

  function hideAlerts() {
    errorMsg.classList.add("hidden");
    successMsg.classList.add("hidden");
  }

  function setBtnLoading(loading) {
    const btn     = document.getElementById("btn-login");
    const text    = document.getElementById("btn-text");
    const spinner = document.getElementById("btn-spinner");
    if (btn)     btn.disabled = loading;
    if (text)    text.classList.toggle("hidden", loading);
    if (spinner) spinner.classList.toggle("hidden", !loading);
  }
});