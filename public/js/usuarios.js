/* =============================================
   DENTALRAÚL — usuarios.js
   ============================================= */

let usuarios = [];
let rolFiltro = "";
let accionDesactivar = null; // { id, activar: bool }

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await verificarAdmin();
  await loadUsuarios();
  initEventListeners();
});

// Solo admins pueden entrar a esta página
async function verificarAdmin() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/auth/me`, { credentials: "include" });
    const { usuario } = await res.json();
    if (usuario.rol !== "admin") {
      window.location.href = "/dashboard.html";
    }
  } catch {
    window.location.href = "/login.html";
  }
}

async function loadUsuarios() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/usuarios`, { credentials: "include" });
    usuarios = await res.json();
    renderTabla(filtrarPorRol(usuarios));
  } catch (err) {
    console.error("Error cargando usuarios:", err);
  }
}

function filtrarPorRol(lista) {
  if (!rolFiltro) return lista;
  return lista.filter(u => u.rol === rolFiltro);
}

function renderTabla(lista) {
  const tbody = document.getElementById("tbody-usuarios");

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-state-icon"></div>
        <p>No hay usuarios en esta categoría</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(u => {
    const iniciales = `${u.nombre[0]}${u.apellidos[0]}`.toUpperCase();
    const badgeRol  = `badge-${u.rol}`;
    const badgeEstado = u.activo ? "badge-activo" : "badge-inactivo";
    const estadoTexto = u.activo ? "Activo" : "Inactivo";
    const btnEstado   = u.activo
      ? `<button class="btn btn-secondary btn-sm" onclick="confirmarDesactivar('${u.id}','${u.nombre} ${u.apellidos}', false)">Desactivar</button>`
      : `<button class="btn btn-success btn-sm" onclick="confirmarDesactivar('${u.id}','${u.nombre} ${u.apellidos}', true)">Activar</button>`;

    return `
      <tr>
        <td>
          <div class="usuario-cell">
            <div class="usuario-avatar">${iniciales}</div>
            <span class="usuario-nombre">${u.nombre} ${u.apellidos}</span>
          </div>
        </td>
        <td>${u.email}</td>
        <td><span class="badge ${badgeRol}">${u.rol}</span></td>
        <td>${u.especialidad || "—"}</td>
        <td>${u.telefono || "—"}</td>
        <td><span class="badge ${badgeEstado}">${estadoTexto}</span></td>
        <td>
          <div class="acciones">
            <button class="btn btn-secondary btn-sm" onclick="abrirEditar('${u.id}')">Editar</button>
            ${btnEstado}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function initEventListeners() {
  // Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      rolFiltro = tab.dataset.rol;
      renderTabla(filtrarPorRol(usuarios));
    });
  });

  // Botón nuevo
  document.getElementById("btn-nuevo-usuario").addEventListener("click", () => abrirModal());

  // Modal
  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
  document.getElementById("btn-guardar").addEventListener("click", guardarUsuario);
  document.getElementById("modal-usuario").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModal();
  });

  // Modal desactivar
  document.getElementById("modal-desactivar-close").addEventListener("click", cerrarModalDesactivar);
  document.getElementById("btn-cancelar-desactivar").addEventListener("click", cerrarModalDesactivar);
  document.getElementById("btn-confirmar-desactivar").addEventListener("click", ejecutarDesactivar);
  document.getElementById("modal-desactivar").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModalDesactivar();
  });

  // Mostrar/ocultar especialidad según rol
  document.getElementById("u-rol").addEventListener("change", (e) => {
    const esDoctor = e.target.value === "doctor";
    document.getElementById("u-especialidad").closest(".form-group").style.display = esDoctor ? "block" : "none";
  });
}

function abrirModal(usuario = null) {
  limpiarModal();
  if (usuario) {
    document.getElementById("modal-titulo").textContent  = "Editar usuario";
    document.getElementById("usuario-id").value          = usuario.id;
    document.getElementById("u-nombre").value            = usuario.nombre || "";
    document.getElementById("u-apellidos").value         = usuario.apellidos || "";
    document.getElementById("u-email").value             = usuario.email || "";
    document.getElementById("u-rol").value               = usuario.rol || "recepcionista";
    document.getElementById("u-telefono").value          = usuario.telefono || "";
    document.getElementById("u-especialidad").value      = usuario.especialidad || "";
    document.getElementById("pass-hint").textContent     = "(dejar vacío para no cambiar)";
    // Mostrar especialidad solo si es doctor
    const esDoctor = usuario.rol === "doctor";
    document.getElementById("u-especialidad").closest(".form-group").style.display = esDoctor ? "block" : "none";
  } else {
    document.getElementById("modal-titulo").textContent = "Nuevo usuario";
    document.getElementById("pass-hint").textContent    = "(mín. 6 caracteres)";
  }
  document.getElementById("modal-usuario").classList.add("active");
}

function abrirEditar(id) {
  const usuario = usuarios.find(u => u.id === id);
  if (usuario) abrirModal(usuario);
}

function cerrarModal() {
  document.getElementById("modal-usuario").classList.remove("active");
  limpiarModal();
}

function limpiarModal() {
  ["usuario-id","u-nombre","u-apellidos","u-email","u-password","u-telefono"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("u-rol").value          = "recepcionista";
  document.getElementById("u-especialidad").value = "";
  document.getElementById("modal-alert").innerHTML = "";
}

function confirmarDesactivar(id, nombre, activar) {
  accionDesactivar = { id, activar };
  document.getElementById("titulo-desactivar").textContent = activar ? "Activar usuario" : "Desactivar usuario";
  document.getElementById("texto-desactivar").textContent  = activar
    ? `¿Quieres activar la cuenta de ${nombre}?`
    : `¿Quieres desactivar la cuenta de ${nombre}? No podrá acceder al sistema.`;
  document.getElementById("btn-confirmar-desactivar").textContent = activar ? "Activar" : "Desactivar";
  document.getElementById("btn-confirmar-desactivar").className   = activar ? "btn btn-success" : "btn btn-danger";
  document.getElementById("modal-desactivar").classList.add("active");
}

function cerrarModalDesactivar() {
  accionDesactivar = null;
  document.getElementById("modal-desactivar").classList.remove("active");
}

async function ejecutarDesactivar() {
  if (!accionDesactivar) return;
  const { id, activar } = accionDesactivar;
  const endpoint = activar ? "activar" : "desactivar";
  try {
    const res = await fetch(`${CONFIG.API_URL}/usuarios/${id}/${endpoint}`, {
      method: "PATCH",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Error al actualizar");
    cerrarModalDesactivar();
    await loadUsuarios();
  } catch (err) {
    console.error(err);
  }
}

async function guardarUsuario() {
  const id       = document.getElementById("usuario-id").value;
  const nombre   = document.getElementById("u-nombre").value.trim();
  const apellidos = document.getElementById("u-apellidos").value.trim();
  const email    = document.getElementById("u-email").value.trim();
  const password = document.getElementById("u-password").value;
  const rol      = document.getElementById("u-rol").value;
  const telefono = document.getElementById("u-telefono").value.trim();
  const especialidad = document.getElementById("u-especialidad").value;

  if (!nombre || !apellidos || !email) {
    mostrarAlertModal("Nombre, apellidos y email son obligatorios", "error");
    return;
  }

  if (!id && password.length < 6) {
    mostrarAlertModal("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  try {
    if (id) {
      // Editar — solo actualiza campos de la tabla usuarios
      const body = { nombre, apellidos, rol, telefono: telefono || null, especialidad: especialidad || null };
      const res = await fetch(`${CONFIG.API_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } else {
      // Nuevo usuario
      const res = await fetch(`${CONFIG.API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre, apellidos, email, password, rol, telefono: telefono || null, especialidad: especialidad || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    }

    cerrarModal();
    await loadUsuarios();
  } catch (err) {
    mostrarAlertModal(err.message || "Error al guardar", "error");
  }
}

function mostrarAlertModal(mensaje, tipo) {
  document.getElementById("modal-alert").innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
}