/* =============================================
   DENTALRAÚL — perfil.js
   ============================================= */

let usuarioId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await cargarPerfil();
  initListeners();
});

async function cargarPerfil() {
  const res = await fetch(`${CONFIG.API_URL}/auth/me`, { credentials: "include" });
  const { usuario } = await res.json();
  usuarioId = usuario.id;

  const nombre = `${usuario.nombre} ${usuario.apellidos}`;
  const iniciales = `${usuario.nombre[0]}${usuario.apellidos[0]}`.toUpperCase();

  document.getElementById("perfil-avatar").textContent       = iniciales;
  document.getElementById("perfil-nombre-display").textContent = nombre;
  document.getElementById("p-nombre").value       = usuario.nombre || "";
  document.getElementById("p-apellidos").value    = usuario.apellidos || "";
  document.getElementById("p-email").value        = usuario.email || "";
  document.getElementById("p-telefono").value     = usuario.telefono || "";
  document.getElementById("p-especialidad").value = usuario.especialidad || "";

  const badge = document.getElementById("perfil-rol-badge");
  const roles = { admin:"Administrador", doctor:"Doctor", recepcionista:"Recepcionista", invitado:"Invitado" };
  badge.textContent = roles[usuario.rol] || usuario.rol;
  badge.className   = `badge badge-${usuario.rol}`;

  // Invitado no puede editar
  if (usuario.rol === "invitado") {
    document.querySelectorAll("input:not([disabled]), select, button.btn-primary").forEach(el => {
      el.disabled = true;
      el.style.opacity = "0.5";
    });
  }
}

function initListeners() {
  document.getElementById("btn-guardar-perfil").addEventListener("click", guardarPerfil);
  document.getElementById("btn-cambiar-pass").addEventListener("click", cambiarPassword);
}

async function guardarPerfil() {
  const nombre     = document.getElementById("p-nombre").value.trim();
  const apellidos  = document.getElementById("p-apellidos").value.trim();
  const telefono   = document.getElementById("p-telefono").value.trim();
  const especialidad = document.getElementById("p-especialidad").value;
  const alertEl    = document.getElementById("perfil-alert");

  if (!nombre || !apellidos) {
    alertEl.innerHTML = `<div class="alert alert-error">Nombre y apellidos son obligatorios</div>`;
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_URL}/usuarios/${usuarioId}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellidos, telefono: telefono || null, especialidad: especialidad || null })
    });
    if (!res.ok) throw new Error("Error al guardar");

    alertEl.innerHTML = `<div class="alert alert-success">Perfil actualizado correctamente</div>`;
    setTimeout(() => alertEl.innerHTML = "", 3000);

    // Actualizar nombre en el header
    document.getElementById("user-name").textContent = `${nombre} ${apellidos}`;
    document.getElementById("user-avatar").textContent = `${nombre[0]}${apellidos[0]}`.toUpperCase();
    document.getElementById("perfil-nombre-display").textContent = `${nombre} ${apellidos}`;
    document.getElementById("perfil-avatar").textContent = `${nombre[0]}${apellidos[0]}`.toUpperCase();
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function cambiarPassword() {
  const nueva    = document.getElementById("p-pass-nueva").value;
  const confirma = document.getElementById("p-pass-confirma").value;
  const alertEl  = document.getElementById("pass-alert");

  if (!nueva || nueva.length < 6) {
    alertEl.innerHTML = `<div class="alert alert-error">La contraseña debe tener al menos 6 caracteres</div>`;
    return;
  }
  if (nueva !== confirma) {
    alertEl.innerHTML = `<div class="alert alert-error">Las contraseñas no coinciden</div>`;
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_URL}/auth/cambiar-password`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: nueva })
    });
    if (!res.ok) throw new Error("Error al cambiar contraseña");

    alertEl.innerHTML = `<div class="alert alert-success">Contraseña cambiada correctamente</div>`;
    document.getElementById("p-pass-nueva").value    = "";
    document.getElementById("p-pass-confirma").value = "";
    setTimeout(() => alertEl.innerHTML = "", 3000);
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function togglePass(id) {
  const input = document.getElementById(id);
  input.type  = input.type === "password" ? "text" : "password";
}