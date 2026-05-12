

// Cargar header y sidebar en la página actual
async function loadLayout() {
  try {
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
  } catch (err) {
    console.error("Error cargando layout:", err);
  }
}

// Inicializar header
function initHeader() {
  // Fecha actual
  const dateEl = document.getElementById("header-date");
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long"
    });
  }

  // Botón logout
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", logout);
  }

  // Toggle sidebar en móvil
  const toggle = document.getElementById("sidebar-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.getElementById("sidebar")?.classList.toggle("open");
    });
  }
}

// Inicializar sidebar — marcar enlace activo
function initSidebar() {
  const currentPage = window.location.pathname.split("/").pop().replace(".html", "") || "dashboard";
  document.querySelectorAll(".sidebar-link").forEach(link => {
    if (link.dataset.page === currentPage) {
      link.classList.add("active");
    }
  });
}

// Cargar datos del usuario autenticado
async function loadUsuario() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/auth/me`, { credentials: "include" });
    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }
    const { usuario } = await res.json();
    const nombre = usuario.user_metadata?.nombre || usuario.email;
    const iniciales = nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    const nameEl   = document.getElementById("user-name");
    const avatarEl = document.getElementById("user-avatar");
    if (nameEl)   nameEl.textContent   = nombre;
    if (avatarEl) avatarEl.textContent = iniciales;

    return usuario;
  } catch {
    window.location.href = "/login.html";
  }
}

// Cerrar sesión
async function logout() {
  await fetch(`${CONFIG.API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  window.location.href = "/login.html";
}

// Verificar autenticación (usar en páginas protegidas)
async function checkAuth() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/auth/me`, { credentials: "include" });
    if (!res.ok) window.location.href = "/login.html";
  } catch {
    window.location.href = "/login.html";
  }
}

// Helpers de UI
function showAlert(id, mensaje, tipo = "error") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = mensaje;
  el.className = `alert alert-${tipo}`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

function setLoading(btnId, loading) {
  const btn     = document.getElementById(btnId);
  const text    = btn?.querySelector("[data-text]");
  const spinner = btn?.querySelector(".spinner");
  if (!btn) return;
  btn.disabled = loading;
  if (text)    text.classList.toggle("hidden", loading);
  if (spinner) spinner.classList.toggle("hidden", !loading);
}