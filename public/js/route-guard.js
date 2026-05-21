/* =============================================
   DENTALRAÚL — route-guard.js
   Protección de rutas — incluir en TODAS las páginas
   excepto login.html (antes que cualquier otro script)
   ============================================= */

(async function protegerRuta() {
  // No proteger la página de login
  if (window.location.pathname.includes("login")) return;

  try {
    const res = await fetch(`${window.CONFIG?.API_URL || "/api"}/auth/me`, {
      credentials: "include"
    });

    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }

    const { usuario } = await res.json();

    // Guardar usuario globalmente
    window.USUARIO_ACTUAL = usuario;

    // Redirigir invitado si intenta acceder a páginas de admin
    const paginasAdmin = ["usuarios.html", "catalogo.html"];
    const paginaActual = window.location.pathname.split("/").pop();
    if (usuario.rol === "invitado" && paginasAdmin.includes(paginaActual)) {
      window.location.href = "/dashboard.html";
    }

  } catch {
    window.location.href = "/login.html";
  }
})();