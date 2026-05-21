/* =============================================
   DENTALRAÚL — auth.js
   Funciones globales de autenticación y layout
   ============================================= */

// Cargar header y sidebar
async function loadLayout() {
  try {
    // Ocultar sidebar hasta que esté completamente listo
    const sidebarPlaceholder = document.getElementById("sidebar-placeholder");
    if (sidebarPlaceholder) sidebarPlaceholder.style.visibility = "hidden";

    const [headerRes, sidebarRes] = await Promise.all([
      fetch("/components/header.html"),
      fetch("/components/sidebar.html")
    ]);
    const headerHTML  = await headerRes.text();
    const sidebarHTML = await sidebarRes.text();

    document.getElementById("header-placeholder").innerHTML  = headerHTML;
    document.getElementById("sidebar-placeholder").innerHTML = sidebarHTML;

    initHeader();
    initSidebar();
    await loadUsuario();

    // Mostrar sidebar ya con todo cargado y sin saltos
    if (sidebarPlaceholder) sidebarPlaceholder.style.visibility = "visible";
  } catch (err) {
    console.error("Error cargando layout:", err);
  }
}

function initHeader() {
  const dateEl = document.getElementById("header-date");
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long"
    });
  }

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) btnLogout.addEventListener("click", logout);

  const toggle = document.getElementById("sidebar-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.getElementById("sidebar")?.classList.toggle("open");
    });
  }
}

function initSidebar() {
  const currentPage = window.location.pathname.split("/").pop().replace(".html", "") || "dashboard";
  document.querySelectorAll(".sidebar-link").forEach(link => {
    if (link.dataset.page === currentPage) link.classList.add("active");
  });
}

async function loadUsuario() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/auth/me`, { credentials: "include" });
    if (!res.ok) {
      window.location.href = "/login.html";
      return null;
    }
    const { usuario } = await res.json();
    const nombre    = usuario.nombre ? `${usuario.nombre} ${usuario.apellidos}` : usuario.email;
    const iniciales = nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    const nameEl   = document.getElementById("user-name");
    const avatarEl = document.getElementById("user-avatar");
    if (nameEl)   nameEl.textContent   = nombre;
    if (avatarEl) avatarEl.textContent = iniciales;

    // Badge invitado
    if (usuario.rol === "invitado") {
      mostrarBadgeInvitado();
      bloquearAccionesEscritura();
    }

    // Sección admin en sidebar
    const seccionAdmin = document.getElementById("seccion-admin");
    if (seccionAdmin && ["admin"].includes(usuario.rol)) {
      seccionAdmin.classList.add("visible");
    }

    return usuario;
  } catch {
    window.location.href = "/login.html";
    return null;
  }
}

// Badge visible para invitados
function mostrarBadgeInvitado() {
  const badge = document.createElement("div");
  badge.className = "invitado-badge";
  badge.innerHTML = `
    <span>Modo invitado — Solo lectura</span>
    <a href="/login.html" class="invitado-badge-login">Iniciar sesión</a>
  `;
  document.body.appendChild(badge);
}

// Bloquear todos los botones de escritura para invitados
function bloquearAccionesEscritura() {
  // Esperar a que el DOM esté listo
  const observer = new MutationObserver(() => {
    document.querySelectorAll(
      "button.btn-primary, button.btn-danger, button.btn-success, " +
      "button[onclick], input[type='file']"
    ).forEach(el => {
      // Excluir botones de logout y navegación
      if (el.id === "btn-logout" || el.closest(".sidebar") || el.closest(".app-header")) return;
      el.disabled = true;
      el.style.opacity = "0.4";
      el.style.cursor  = "not-allowed";
      el.title = "Modo invitado — solo lectura";
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

async function logout() {
  await fetch(`${CONFIG.API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  window.location.href = "/login.html";
}

// Proteger páginas — redirige al login si no hay sesión
async function checkAuth() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/auth/me`, { credentials: "include" });
    if (!res.ok) window.location.href = "/login.html";
    const { usuario } = await res.json();
    return usuario;
  } catch {
    window.location.href = "/login.html";
    return null;
  }
}

function showAlert(id, mensaje, tipo = "error") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = mensaje;
  el.className = `alert alert-${tipo}`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}