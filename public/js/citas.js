/* =============================================
   DENTALRAÚL — citas.js
   ============================================= */

let citas = [];
let citaIdEliminar = null;
let buscadorCitas = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await Promise.all([loadCitas(), cargarSelects()]);
  initEventListeners();
});

async function loadCitas() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/citas`, { credentials: "include" });
    citas = await res.json();
    renderTabla(citas);
  } catch (err) {
    console.error("Error cargando citas:", err);
  }
}

async function cargarSelects() {
  try {
    const [pacientesRes, doctoresRes] = await Promise.all([
      fetch(`${CONFIG.API_URL}/pacientes`, { credentials: "include" }),
      fetch(`${CONFIG.API_URL}/usuarios/doctores`, { credentials: "include" })
    ]);
    const pacientes = await pacientesRes.json();
    const doctores  = await doctoresRes.json();

    // c-paciente es ahora un buscador, inicializar
    buscadorCitas = new PacienteBuscador("c-paciente-input", (paciente) => {
      document.getElementById("c-paciente").value = paciente.id;
    });

    const selDoctor = document.getElementById("c-doctor");
    doctores.forEach(d => {
      selDoctor.innerHTML += `<option value="${d.id}">${d.apellidos}, ${d.nombre}${d.especialidad ? ` — ${d.especialidad}` : ""}</option>`;
    });
  } catch (err) {
    console.error("Error cargando selects:", err);
  }
}

function renderTabla(lista) {
  const tbody = document.getElementById("tbody-citas");

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-state-icon"></div>
        <p>No hay citas</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(c => `
    <tr>
      <td>${formatFecha(c.fecha)}</td>
      <td>${c.hora?.slice(0,5)}</td>
      <td>${c.pacientes?.nombre} ${c.pacientes?.apellidos}</td>
      <td>${c.usuarios ? `${c.usuarios.nombre} ${c.usuarios.apellidos}` : "—"}</td>
      <td>${c.especialidad || "—"}</td>
      <td class="text-muted">${c.motivo || "—"}</td>
      <td><span class="badge ${badgeEstado(c.estado)}">${c.estado}</span></td>
      <td>
        <div class="acciones">
          <button class="btn btn-secondary btn-sm" onclick="abrirEditar('${c.id}')">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="confirmarEliminar('${c.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function initEventListeners() {
  document.getElementById("btn-nueva-cita").addEventListener("click", () => abrirModal());
  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
  document.getElementById("modal-eliminar-close").addEventListener("click", cerrarModalEliminar);
  document.getElementById("btn-cancelar-eliminar").addEventListener("click", cerrarModalEliminar);
  document.getElementById("btn-guardar").addEventListener("click", guardarCita);
  document.getElementById("btn-confirmar-eliminar").addEventListener("click", eliminarCita);
  document.getElementById("btn-limpiar-filtros").addEventListener("click", limpiarFiltros);

  document.getElementById("modal-cita").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModal();
  });
  document.getElementById("modal-eliminar").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModalEliminar();
  });

  // Filtros
  ["filtro-fecha", "filtro-estado", "filtro-especialidad"].forEach(id => {
    document.getElementById(id).addEventListener("change", aplicarFiltros);
  });
}

function aplicarFiltros() {
  const fecha       = document.getElementById("filtro-fecha").value;
  const estado      = document.getElementById("filtro-estado").value;
  const especialidad = document.getElementById("filtro-especialidad").value;

  const filtradas = citas.filter(c => {
    if (fecha && c.fecha !== fecha) return false;
    if (estado && c.estado !== estado) return false;
    if (especialidad && c.especialidad !== especialidad) return false;
    return true;
  });
  renderTabla(filtradas);
}

function limpiarFiltros() {
  document.getElementById("filtro-fecha").value        = "";
  document.getElementById("filtro-estado").value       = "";
  document.getElementById("filtro-especialidad").value = "";
  renderTabla(citas);
}

function abrirModal(cita = null) {
  limpiarModal();
  if (cita) {
    document.getElementById("modal-titulo").textContent = "Editar cita";
    document.getElementById("cita-id").value            = cita.id;
    const hidden = document.getElementById("c-paciente");
    const input  = document.getElementById("c-paciente-input");
    if (hidden) hidden.value = cita.paciente_id || "";
    if (input && cita.pacientes) input.value = `${cita.pacientes.apellidos}, ${cita.pacientes.nombre}`;
    document.getElementById("c-doctor").value           = cita.doctor_id || "";
    document.getElementById("c-fecha").value            = cita.fecha || "";
    document.getElementById("c-hora").value             = cita.hora?.slice(0,5) || "";
    document.getElementById("c-especialidad").value     = cita.especialidad || "";
    document.getElementById("c-estado").value           = cita.estado || "pendiente";
    document.getElementById("c-motivo").value           = cita.motivo || "";
  } else {
    document.getElementById("modal-titulo").textContent = "Nueva cita";
    // Fecha de hoy por defecto
    document.getElementById("c-fecha").value = new Date().toISOString().split("T")[0];
  }
  document.getElementById("modal-cita").classList.add("active");
}

function abrirEditar(id) {
  const cita = citas.find(c => c.id === id);
  if (cita) abrirModal(cita);
}

function cerrarModal() {
  document.getElementById("modal-cita").classList.remove("active");
  limpiarModal();
}

function limpiarModal() {
  ["cita-id","c-fecha","c-hora","c-motivo"].forEach(id => {
    document.getElementById(id).value = "";
  });
  const hidden = document.getElementById("c-paciente");
  const input  = document.getElementById("c-paciente-input");
  if (hidden) hidden.value = "";
  if (input)  input.value  = "";
  if (buscadorCitas) buscadorCitas.seleccionado = null;
  document.getElementById("c-doctor").value       = "";
  document.getElementById("c-especialidad").value = "";
  document.getElementById("c-estado").value       = "pendiente";
  document.getElementById("modal-alert").innerHTML = "";
}

function confirmarEliminar(id) {
  citaIdEliminar = id;
  document.getElementById("modal-eliminar").classList.add("active");
}

function cerrarModalEliminar() {
  citaIdEliminar = null;
  document.getElementById("modal-eliminar").classList.remove("active");
}

async function guardarCita() {
  const id         = document.getElementById("cita-id").value;
  const paciente_id = document.getElementById("c-paciente").value;
  const doctor_id  = document.getElementById("c-doctor").value;
  const fecha      = document.getElementById("c-fecha").value;
  const hora       = document.getElementById("c-hora").value;

  if (!paciente_id || !fecha || !hora) {
    mostrarAlertModal("Paciente, fecha y hora son obligatorios", "error");
    return;
  }

  const body = {
    paciente_id,
    doctor_id:    doctor_id || null,
    fecha,
    hora,
    especialidad: document.getElementById("c-especialidad").value || null,
    estado:       document.getElementById("c-estado").value,
    motivo:       document.getElementById("c-motivo").value.trim() || null
  };

  try {
    const url    = id ? `${CONFIG.API_URL}/citas/${id}` : `${CONFIG.API_URL}/citas`;
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
    await loadCitas();
  } catch (err) {
    mostrarAlertModal(err.message || "Error al guardar", "error");
  }
}

async function eliminarCita() {
  if (!citaIdEliminar) return;
  try {
    const res = await fetch(`${CONFIG.API_URL}/citas/${citaIdEliminar}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Error al eliminar");
    cerrarModalEliminar();
    await loadCitas();
  } catch (err) {
    console.error(err);
  }
}

function mostrarAlertModal(mensaje, tipo) {
  document.getElementById("modal-alert").innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
}

function badgeEstado(estado) {
  const map = {
    pendiente:   "badge-pending",
    confirmada:  "badge-confirmada",
    en_espera:   "badge-en_espera",
    en_consulta: "badge-en_consulta",
    completada:  "badge-completed",
    cancelada:   "badge-cancelled"
  };
  return map[estado] || "badge-info";
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}