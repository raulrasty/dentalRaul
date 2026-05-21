/* =============================================
   DENTALRAÚL — pacientes.js
   ============================================= */

let pacientes = [];
let pacienteIdEliminar = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await loadPacientes();
  initEventListeners();
});

async function loadPacientes() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/pacientes`, { credentials: "include" });
    pacientes = await res.json();
    renderTabla(pacientes);
  } catch (err) {
    console.error("Error cargando pacientes:", err);
  }
}

function renderTabla(lista) {
  const tbody = document.getElementById("tbody-pacientes");

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-state-icon"></div>
          <p>No hay pacientes registrados</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const iniciales = `${p.nombre[0]}${p.apellidos[0]}`.toUpperCase();
    return `
      <tr>
        <td>
          <div class="paciente-nombre-cell">
            <span class="paciente-tabla-avatar">${iniciales}</span>
            <a class="paciente-nombre-link" href="/paciente-detalle.html?id=${p.id}">
              ${p.nombre} ${p.apellidos}
            </a>
          </div>
        </td>
        <td>${p.dni || "—"}</td>
        <td>${p.telefono || "—"}</td>
        <td>${p.email || "—"}</td>
        <td>${formatFecha(p.fecha_nacimiento)}</td>
        <td>
          <div class="acciones">
            <button class="btn btn-secondary btn-sm" onclick="abrirEditar('${p.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="confirmarEliminar('${p.id}', '${p.nombre} ${p.apellidos}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function initEventListeners() {
  // Buscador
  document.getElementById("buscador").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtrados = pacientes.filter(p =>
      `${p.nombre} ${p.apellidos}`.toLowerCase().includes(q) ||
      (p.dni || "").toLowerCase().includes(q)
    );
    renderTabla(filtrados);
  });

  // Abrir modal nuevo
  document.getElementById("btn-nuevo-paciente").addEventListener("click", () => abrirModal());

  // Cerrar modales
  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
  document.getElementById("modal-eliminar-close").addEventListener("click", cerrarModalEliminar);
  document.getElementById("btn-cancelar-eliminar").addEventListener("click", cerrarModalEliminar);

  // Cerrar al hacer clic fuera
  document.getElementById("modal-paciente").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) cerrarModal();
  });
  document.getElementById("modal-eliminar").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) cerrarModalEliminar();
  });

  // Guardar paciente
  document.getElementById("btn-guardar").addEventListener("click", guardarPaciente);

  // Confirmar eliminar
  document.getElementById("btn-confirmar-eliminar").addEventListener("click", eliminarPaciente);
}

function abrirModal(paciente = null) {
  limpiarModal();
  if (paciente) {
    document.getElementById("modal-titulo").textContent = "Editar paciente";
    document.getElementById("paciente-id").value        = paciente.id;
    document.getElementById("p-nombre").value           = paciente.nombre || "";
    document.getElementById("p-apellidos").value        = paciente.apellidos || "";
    document.getElementById("p-dni").value              = paciente.dni || "";
    document.getElementById("p-telefono").value         = paciente.telefono || "";
    document.getElementById("p-email").value            = paciente.email || "";
    document.getElementById("p-fecha-nacimiento").value = paciente.fecha_nacimiento || "";
  } else {
    document.getElementById("modal-titulo").textContent = "Nuevo paciente";
  }
  document.getElementById("modal-paciente").classList.add("active");
}

function abrirEditar(id) {
  const paciente = pacientes.find(p => p.id === id);
  if (paciente) abrirModal(paciente);
}

function cerrarModal() {
  document.getElementById("modal-paciente").classList.remove("active");
  limpiarModal();
}

function limpiarModal() {
  document.getElementById("paciente-id").value        = "";
  document.getElementById("p-nombre").value           = "";
  document.getElementById("p-apellidos").value        = "";
  document.getElementById("p-dni").value              = "";
  document.getElementById("p-telefono").value         = "";
  document.getElementById("p-email").value            = "";
  document.getElementById("p-fecha-nacimiento").value = "";
  document.getElementById("modal-alert").innerHTML    = "";
}

function confirmarEliminar(id, nombre) {
  pacienteIdEliminar = id;
  document.getElementById("nombre-eliminar").textContent = nombre;
  document.getElementById("modal-eliminar").classList.add("active");
}

function cerrarModalEliminar() {
  pacienteIdEliminar = null;
  document.getElementById("modal-eliminar").classList.remove("active");
}

async function guardarPaciente() {
  const id       = document.getElementById("paciente-id").value;
  const nombre   = document.getElementById("p-nombre").value.trim();
  const apellidos = document.getElementById("p-apellidos").value.trim();

  if (!nombre || !apellidos) {
    mostrarAlertModal("El nombre y apellidos son obligatorios", "error");
    return;
  }

  const body = {
    nombre,
    apellidos,
    dni:              document.getElementById("p-dni").value.trim() || null,
    telefono:         document.getElementById("p-telefono").value.trim() || null,
    email:            document.getElementById("p-email").value.trim() || null,
    fecha_nacimiento: document.getElementById("p-fecha-nacimiento").value || null
  };

  try {
    const url    = id ? `${CONFIG.API_URL}/pacientes/${id}` : `${CONFIG.API_URL}/pacientes`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    cerrarModal();
    await loadPacientes();
  } catch (err) {
    mostrarAlertModal(err.message || "Error al guardar", "error");
  }
}

async function eliminarPaciente() {
  if (!pacienteIdEliminar) return;
  try {
    const res = await fetch(`${CONFIG.API_URL}/pacientes/${pacienteIdEliminar}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Error al eliminar");
    cerrarModalEliminar();
    await loadPacientes();
  } catch (err) {
    console.error(err);
  }
}

function mostrarAlertModal(mensaje, tipo) {
  const el = document.getElementById("modal-alert");
  el.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}