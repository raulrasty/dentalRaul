/* =============================================
   DENTALRAÚL — agenda-extras.js
   Línea de hora actual + buscador pacientes en agenda
   ============================================= */

/* =====================
   BUSCADOR DE PACIENTES EN MODAL CITA
   ===================== */
let buscadorAgenda = null;

function initBuscadorAgenda() {
  if (buscadorAgenda) return; // ya iniciado
  buscadorAgenda = new PacienteBuscador("c-paciente-input", (paciente) => {
    document.getElementById("c-paciente").value = paciente.id;
  });
}

// Resetear buscador al abrir modal
function resetBuscadorAgenda() {
  const input  = document.getElementById("c-paciente-input");
  const hidden = document.getElementById("c-paciente");
  if (input)  input.value  = "";
  if (hidden) hidden.value = "";
  if (buscadorAgenda) buscadorAgenda.seleccionado = null;
}

// Rellenar buscador al editar una cita existente
function setBuscadorPaciente(nombre, pacienteId) {
  const input  = document.getElementById("c-paciente-input");
  const hidden = document.getElementById("c-paciente");
  if (input)  input.value  = nombre;
  if (hidden) hidden.value = pacienteId;
}

/* =====================
   LÍNEA DE HORA ACTUAL
   ===================== */
const AGENDA_HORA_INICIO = 9;
const AGENDA_HORA_FIN    = 20;
const AGENDA_SLOT_MIN    = 15;
const AGENDA_SLOT_PX     = 30;
const AGENDA_HEADER_PX   = 56;

function actualizarLineaHora() {
  document.querySelectorAll(".linea-hora-actual").forEach(el => el.remove());

  const ahora = new Date();
  const hh    = ahora.getHours();
  const mm    = ahora.getMinutes();

  if (hh < AGENDA_HORA_INICIO || hh >= AGENDA_HORA_FIN) return;

  const minutosDesdeInicio = (hh - AGENDA_HORA_INICIO) * 60 + mm;
  const top     = (minutosDesdeInicio / AGENDA_SLOT_MIN) * AGENDA_SLOT_PX + AGENDA_HEADER_PX;
  const horaStr = `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;

  document.querySelectorAll(".col-dia, .col-doctor").forEach(col => {
    const linea = document.createElement("div");
    linea.className    = "linea-hora-actual";
    linea.style.top    = `${top}px`;
    linea.dataset.hora = horaStr;
    col.appendChild(linea);
  });
}

function iniciarLineaHora() {
  actualizarLineaHora();
  setInterval(actualizarLineaHora, 60000);
}

/* =====================
   INIT
   ===================== */
document.addEventListener("DOMContentLoaded", () => {
  // Iniciar buscador cuando el modal esté en el DOM
  setTimeout(() => {
    initBuscadorAgenda();

    // Observer para re-actualizar línea de hora cuando cambie la agenda
    const agendaContainer = document.getElementById("agenda-container");
    if (agendaContainer) {
      const obs = new MutationObserver(() => actualizarLineaHora());
      obs.observe(agendaContainer, { childList: true, subtree: false });
    }
  }, 800);

  iniciarLineaHora();
});