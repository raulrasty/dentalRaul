/* =============================================
   DENTALRAÚL — agenda.js
   ============================================= */

const HORA_INICIO = 9;
const HORA_FIN    = 20;
const SLOT_MIN    = 15;
const SLOT_PX     = 30;
const TOTAL_SLOTS = ((HORA_FIN - HORA_INICIO) * 60) / SLOT_MIN;

// El header de la vista semana tiene altura variable según CSS rendered
// Lo medimos dinámicamente en lugar de hardcodearlo
let HEADER_PX = 56;

const DIAS_SEMANA = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

const COLORES = {
  "Odontología general": "esp-odontologia-general",
  "Ortodoncia":          "esp-ortodoncia",
  "Endodoncia":          "esp-endodoncia",
  "Periodoncia":         "esp-periodoncia",
  "Implantología":       "esp-implantologia",
  "Cirugía oral":        "esp-cirugia-oral",
  "Odontopediatría":     "esp-odontopediatria",
  "Estética dental":     "esp-estetica-dental",
  "Blanqueamiento":      "esp-blanqueamiento",
  "Urgencia":            "esp-urgencia"
};

let vistaActual  = "doctor";
let doctores     = [];
let pacientes    = [];
let citas        = [];
let bloqueos     = [];
let doctorSelec  = null;
let fechaSelec   = new Date();
let semanaOffset = 0;
let drag         = null;
let citaCopiada  = null;
let citaCortada  = null;
let citaContextId = null;
let modoBloqueo  = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await cargarDatos();
  initEventListeners();
  actualizarSemanaLabel();
  document.getElementById("sel-fecha").value = formatDateISO(new Date());
  initBuscadorCita();
  iniciarLineaHora();
});

/* =====================
   CARGA DE DATOS
   ===================== */
async function cargarDatos() {
  const [docRes, pacRes] = await Promise.all([
    fetch(`${CONFIG.API_URL}/usuarios/doctores`, { credentials: "include" }),
    fetch(`${CONFIG.API_URL}/pacientes`, { credentials: "include" })
  ]);
  doctores  = await docRes.json();
  pacientes = await pacRes.json();
  cargarSelectDoctores();
  cargarSelectsModal();
}

function cargarSelectDoctores() {
  const sel = document.getElementById("sel-doctor");
  doctores.forEach(d => {
    sel.innerHTML += `<option value="${d.id}">${d.nombre} ${d.apellidos}</option>`;
  });
}

function cargarSelectsModal() {
  // c-paciente es ahora un buscador, no un select
  const selD = document.getElementById("c-doctor");
  doctores.forEach(d => {
    selD.innerHTML += `<option value="${d.id}">${d.apellidos}, ${d.nombre}${d.especialidad ? ` — ${d.especialidad}` : ""}</option>`;
  });
}

async function cargarCitas(desde, hasta) {
  const res   = await fetch(`${CONFIG.API_URL}/citas`, { credentials: "include" });
  const todas = await res.json();
  citas = todas.filter(c => c.fecha >= desde && c.fecha <= hasta);
}

async function cargarBloqueos(desde, hasta, doctorId = null) {
  let url = `${CONFIG.API_URL}/bloqueos?desde=${desde}&hasta=${hasta}`;
  if (doctorId) url += `&doctor_id=${doctorId}`;
  const res = await fetch(url, { credentials: "include" });
  bloqueos = await res.json();
}

/* =====================
   MEDIR HEADER REAL
   ===================== */
function medirHeader() {
  const h = document.querySelector(".agenda-semana-header, .col-doctor-header");
  if (h) HEADER_PX = h.getBoundingClientRect().height;
}

/* =====================
   VISTA SEMANA
   ===================== */
async function renderVistaSemana() {
  if (!doctorSelec) return;

  const lunes   = getLunesSemana(semanaOffset);
  const viernes = new Date(lunes); viernes.setDate(viernes.getDate() + 4);
  const desde   = formatDateISO(lunes);
  const hasta   = formatDateISO(viernes);

  await Promise.all([
    cargarCitas(desde, hasta),
    cargarBloqueos(desde, hasta, doctorSelec)
  ]);

  const citasDoctor   = citas.filter(c => c.doctor_id === doctorSelec);
  const bloqueosDoctor = bloqueos.filter(b => b.doctor_id === doctorSelec);
  const hoy = formatDateISO(new Date());

  const fechas = Array.from({length: 5}, (_, i) => {
    const d = new Date(lunes); d.setDate(d.getDate() + i); return d;
  });

  let html = `<div class="agenda-semana">`;

  // Header
  html += `<div class="agenda-semana-header">`;
  html += `<div class="col-header col-hora"></div>`;
  fechas.forEach((fecha, i) => {
    const eHoy = formatDateISO(fecha) === hoy;
    html += `<div class="col-header${eHoy ? " hoy" : ""}">
      ${DIAS_SEMANA[i]}<br><small>${fecha.getDate()}/${fecha.getMonth()+1}</small>
    </div>`;
  });
  html += `</div>`;

  // Body
  html += `<div class="agenda-body">`;
  html += generarColHoras();

  fechas.forEach(fecha => {
    const fechaStr      = formatDateISO(fecha);
    const citasDia      = citasDoctor.filter(c => c.fecha === fechaStr);
    const bloqueosDia   = bloqueosDoctor.filter(b => b.fecha === fechaStr);

    html += `<div class="col-dia agenda-col" data-fecha="${fechaStr}" data-doctor="${doctorSelec}">`;
    html += generarSlots(fechaStr, doctorSelec);
    bloqueosDia.forEach(b => { html += renderBloqueoBloque(b); });
    citasDia.forEach(c => { html += renderCitaBloque(c); });
    html += `</div>`;
  });

  html += `</div></div>`;
  document.getElementById("agenda-container").innerHTML = html;

  // Medir header real tras render
  requestAnimationFrame(() => {
    const headerEl = document.querySelector(".agenda-semana-header");
    if (headerEl) HEADER_PX = headerEl.offsetHeight;
    // Re-posicionar citas y bloqueos con altura correcta
    reposicionarElementos();
    initDragResize();
  });
}

/* =====================
   VISTA DÍA
   ===================== */
async function renderVistasDia() {
  const fechaStr = formatDateISO(fechaSelec);
  await Promise.all([
    cargarCitas(fechaStr, fechaStr),
    cargarBloqueos(fechaStr, fechaStr)
  ]);

  let html = `<div style="display:flex; min-width:${60 + doctores.length * 160}px;">`;

  // Col horas
  html += `<div style="display:flex;flex-direction:column;flex-shrink:0;">`;
  html += `<div class="agenda-dia-hora-esquina"></div>`;
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const mins = HORA_INICIO * 60 + i * SLOT_MIN;
    const hh   = Math.floor(mins/60), mm = mins % 60;
    html += `<div class="hora-label${mm === 0 ? " hora-entera" : ""}" style="width:60px;">
      ${mm === 0 ? `${String(hh).padStart(2,"0")}:00` : ""}
    </div>`;
  }
  html += `</div>`;

  doctores.forEach(doc => {
    const citasDoc    = citas.filter(c => c.doctor_id === doc.id);
    const bloqueosDoc = bloqueos.filter(b => b.doctor_id === doc.id);

    html += `<div class="col-doctor agenda-col" data-fecha="${fechaStr}" data-doctor="${doc.id}">`;
    html += `<div class="col-doctor-header">${doc.nombre} ${doc.apellidos}<br>
      <small style="color:var(--text-muted);font-weight:400;">${doc.especialidad || ""}</small></div>`;
    html += generarSlots(fechaStr, doc.id);
    bloqueosDoc.forEach(b => { html += renderBloqueoBloque(b); });
    citasDoc.forEach(c => { html += renderCitaBloque(c); });
    html += `</div>`;
  });

  html += `</div>`;
  document.getElementById("agenda-container").innerHTML = html;

  requestAnimationFrame(() => {
    const headerEl = document.querySelector(".col-doctor-header");
    if (headerEl) HEADER_PX = headerEl.offsetHeight;
    reposicionarElementos();
    initDragResize();
  });
}

/* =====================
   RE-POSICIONAR tras medir header real
   ===================== */
function reposicionarElementos() {
  document.querySelectorAll(".agenda-cita, .agenda-bloqueo").forEach(el => {
    const horaStr = el.dataset.hora;
    const duracion = parseInt(el.dataset.duracion || 30);
    if (!horaStr) return;
    const [hh, mm]           = horaStr.split(":").map(Number);
    const minutosDesdeInicio = (hh - HORA_INICIO) * 60 + mm;
    const top    = (minutosDesdeInicio / SLOT_MIN) * SLOT_PX + HEADER_PX;
    const altura = Math.max((duracion / SLOT_MIN) * SLOT_PX, SLOT_PX);
    el.style.top    = `${top}px`;
    el.style.height = `${altura}px`;
  });
}

/* =====================
   HELPERS RENDER
   ===================== */
function generarColHoras() {
  let html = `<div class="col-horas">`;
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const mins = HORA_INICIO * 60 + i * SLOT_MIN;
    const hh   = Math.floor(mins/60), mm = mins % 60;
    html += `<div class="hora-label${mm === 0 ? " hora-entera" : ""}">
      ${mm === 0 ? `${String(hh).padStart(2,"0")}:00` : ""}
    </div>`;
  }
  return html + `</div>`;
}

function generarSlots(fechaStr, doctorId) {
  let html = "";
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const mins    = HORA_INICIO * 60 + i * SLOT_MIN;
    const mm      = mins % 60;
    const tipo    = mm === 0 ? "hora-entera" : mm === 30 ? "media-hora" : "cuarto";
    const horaStr = `${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
    html += `<div class="slot ${tipo}" data-fecha="${fechaStr}" data-hora="${horaStr}" data-doctor="${doctorId}"
      onclick="onSlotClick('${fechaStr}','${horaStr}','${doctorId}')"
      oncontextmenu="onSlotRightClick(event,'${fechaStr}','${horaStr}','${doctorId}')"></div>`;
  }
  return html;
}

function renderCitaBloque(cita) {
  const [hh, mm]           = cita.hora.split(":").map(Number);
  const minutosDesdeInicio = (hh - HORA_INICIO) * 60 + mm;
  const top      = (minutosDesdeInicio / SLOT_MIN) * SLOT_PX + HEADER_PX;
  const duracion = cita.duracion_minutos || 30;
  const altura   = Math.max((duracion / SLOT_MIN) * SLOT_PX, SLOT_PX);
  const color    = COLORES[cita.especialidad] || "esp-default";
  const paciente = cita.pacientes ? `${cita.pacientes.nombre} ${cita.pacientes.apellidos}` : "Paciente";
  const estadoCls = `estado-${cita.estado || "pendiente"}`;
  const smallCls  = altura <= 30 ? "cita-xs" : altura <= 45 ? "cita-sm" : "";
  const estadoIcono = { pendiente:"", confirmada:"✓", en_espera:"", en_consulta:"", completada:"✔", cancelada:"✕" }[cita.estado] || "";
  const motivo    = cita.motivo ? `<span class="cita-motivo">${cita.motivo}</span>` : "";

  return `
    <div class="agenda-cita ${color} ${estadoCls} ${smallCls}"
      data-id="${cita.id}"
      data-hora="${cita.hora.slice(0,5)}"
      data-duracion="${duracion}"
      style="top:${top}px; height:${altura}px;"
      title="${paciente} — ${cita.especialidad || cita.motivo || ""} (${cita.estado})">
      <div class="cita-estado-bar"></div>
      <div class="cita-drag-handle">
        <span class="cita-hora-label">${cita.hora.slice(0,5)} ${estadoIcono}</span>
        <span class="cita-paciente-nombre">${paciente}</span>
        ${motivo}
      </div>
      <div class="cita-resize-handle"></div>
    </div>`;
}

function renderBloqueoBloque(b) {
  const [hh, mm]           = b.hora_inicio.split(":").map(Number);
  const minutosDesdeInicio = (hh - HORA_INICIO) * 60 + mm;
  const top      = (minutosDesdeInicio / SLOT_MIN) * SLOT_PX + HEADER_PX;
  const [hf, mf] = b.hora_fin.split(":").map(Number);
  const duracion = (hf * 60 + mf) - (hh * 60 + mm);
  const altura   = Math.max((duracion / SLOT_MIN) * SLOT_PX, SLOT_PX);

  return `
    <div class="agenda-bloqueo"
      data-id="${b.id}"
      data-hora="${b.hora_inicio.slice(0,5)}"
      data-duracion="${duracion}"
      style="top:${top}px; height:${altura}px;"
      title="Bloqueado: ${b.motivo || "Sin motivo"}"
      oncontextmenu="onBloqueoRightClick(event,'${b.id}')">
      
      <span class="bloqueo-texto">${b.motivo || "Bloqueado"}</span>
    </div>`;
}

/* =====================
   CLICKS EN SLOTS
   ===================== */
function onSlotClick(fecha, hora, doctorId) {
  if (modoBloqueo) {
    abrirModalBloqueo(fecha, hora, doctorId);
  } else {
    abrirNuevaCita(fecha, hora, doctorId);
  }
}

function onSlotRightClick(e, fecha, hora, doctorId) {
  e.preventDefault();
  e.stopPropagation();
  cerrarContextMenu();

  const items = citaCopiada
    ? `<div class="context-item" onclick="pegarEnSlot('${fecha}','${hora}','${doctorId}')">📌 Pegar cita aquí</div>`
    : "";

  const menu = document.createElement("div");
  menu.id = "context-menu";
  menu.className = "context-menu";
  menu.innerHTML = `
    ${items}
    <div class="context-item" onclick="abrirModalBloqueo('${fecha}','${hora}','${doctorId}')">🔒 Bloquear hueco</div>
  `;

  if (!items && !menu.querySelector(".context-item")) return;

  document.body.appendChild(menu);
  posicionarMenu(menu, e);
  setTimeout(() => document.addEventListener("click", cerrarContextMenu, { once: true }), 0);
}

function onBloqueoRightClick(e, bloqueoId) {
  e.preventDefault();
  e.stopPropagation();
  cerrarContextMenu();

  const menu = document.createElement("div");
  menu.id = "context-menu";
  menu.className = "context-menu";
  menu.innerHTML = `
    <div class="context-item context-danger" onclick="eliminarBloqueo('${bloqueoId}')">🔓 Desbloquear hueco</div>
  `;

  document.body.appendChild(menu);
  posicionarMenu(menu, e);
  setTimeout(() => document.addEventListener("click", cerrarContextMenu, { once: true }), 0);
}

/* =====================
   MODAL BLOQUEO
   ===================== */
function abrirModalBloqueo(fecha, horaInicio, doctorId) {
  cerrarContextMenu();
  document.getElementById("b-fecha").value      = fecha;
  document.getElementById("b-hora-inicio").value = horaInicio;
  document.getElementById("b-doctor").value      = doctorId;
  // Hora fin = horaInicio + 1h por defecto
  const [hh, mm] = horaInicio.split(":").map(Number);
  const finMins  = hh * 60 + mm + 60;
  const hf = Math.min(Math.floor(finMins/60), HORA_FIN);
  const mf = finMins % 60;
  document.getElementById("b-hora-fin").value = `${String(hf).padStart(2,"0")}:${String(mf).padStart(2,"0")}`;
  document.getElementById("b-motivo").value   = "";
  document.getElementById("modal-bloqueo").classList.add("active");
}

async function guardarBloqueo() {
  const doctor_id  = document.getElementById("b-doctor").value;
  const fecha      = document.getElementById("b-fecha").value;
  const hora_inicio = document.getElementById("b-hora-inicio").value;
  const hora_fin   = document.getElementById("b-hora-fin").value;
  const motivo     = document.getElementById("b-motivo").value.trim() || null;

  try {
    const res = await fetch(`${CONFIG.API_URL}/bloqueos`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id, fecha, hora_inicio, hora_fin, motivo })
    });
    if (!res.ok) throw new Error("Error al bloquear");
    document.getElementById("modal-bloqueo").classList.remove("active");
    vistaActual === "doctor" ? renderVistaSemana() : renderVistasDia();
  } catch (err) {
    console.error(err);
  }
}

async function eliminarBloqueo(id) {
  cerrarContextMenu();
  await fetch(`${CONFIG.API_URL}/bloqueos/${id}`, { method: "DELETE", credentials: "include" });
  vistaActual === "doctor" ? renderVistaSemana() : renderVistasDia();
}

/* =====================
   DRAG & RESIZE
   ===================== */
function initDragResize() {
  document.querySelectorAll(".agenda-cita").forEach(el => {
    el.querySelector(".cita-resize-handle").addEventListener("mousedown", onResizeStart);
    el.querySelector(".cita-drag-handle").addEventListener("mousedown", onDragStart);

    let lastMouseDown = 0;
    el.querySelector(".cita-drag-handle").addEventListener("mousedown", (e) => {
      const now = Date.now();
      if (now - lastMouseDown < 350) {
        e.stopPropagation();
        el.dataset.dblclick = "1";
        abrirEditarCita(el.dataset.id);
        lastMouseDown = 0;
      } else {
        lastMouseDown = now;
        el.dataset.dblclick = "0";
      }
    }, true);

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      mostrarContextMenuCita(e, el.dataset.id);
    });
  });
}

function onDragStart(e) {
  e.preventDefault();
  e.stopPropagation();
  const el      = e.currentTarget.closest(".agenda-cita");
  const col     = el.closest(".agenda-col");
  const citaTop = parseInt(el.style.top);
  const colRect = col.getBoundingClientRect();
  const startY  = e.clientY;

  function onMoveThreshold(ev) {
    if (el.dataset.dblclick === "1") {
      document.removeEventListener("mousemove", onMoveThreshold);
      document.removeEventListener("mouseup",   onCancelThreshold);
      return;
    }
    if (Math.abs(ev.clientY - startY) < 5) return;
    document.removeEventListener("mousemove", onMoveThreshold);

    drag = {
      type: "move", el, col,
      citaId:  el.dataset.id,
      offsetY: startY - colRect.top - citaTop,
    };

    el.style.opacity       = "0.75";
    el.style.zIndex        = "100";
    el.style.pointerEvents = "none";
    document.body.style.cursor = "grabbing";

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup",   onDragEnd);
  }

  function onCancelThreshold() {
    document.removeEventListener("mousemove", onMoveThreshold);
    document.removeEventListener("mouseup",   onCancelThreshold);
  }

  document.addEventListener("mousemove", onMoveThreshold);
  document.addEventListener("mouseup",   onCancelThreshold);
}

function onDragMove(e) {
  if (!drag || drag.type !== "move") return;
  const colRect = drag.col.getBoundingClientRect();
  const rawY    = e.clientY - colRect.top - drag.offsetY;
  const snapped = snapToSlot(rawY);
  const clamped = Math.max(HEADER_PX, Math.min(snapped, HEADER_PX + (TOTAL_SLOTS - 1) * SLOT_PX));
  drag.el.style.top = `${clamped}px`;
}

async function onDragEnd(e) {
  if (!drag || drag.type !== "move") return;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup",   onDragEnd);

  const el     = drag.el;
  const col    = drag.col;
  const top    = parseInt(el.style.top);
  const nueva  = topToHora(top);
  const fecha  = col.dataset.fecha;
  const doctor = col.dataset.doctor;

  el.style.opacity       = "1";
  el.style.zIndex        = "5";
  el.style.pointerEvents = "auto";
  document.body.style.cursor = "";

  await actualizarCita(drag.citaId, { hora: nueva, fecha, doctor_id: doctor });
  drag = null;
  vistaActual === "doctor" ? renderVistaSemana() : renderVistasDia();
}

function onResizeStart(e) {
  e.preventDefault();
  e.stopPropagation();
  const el = e.currentTarget.closest(".agenda-cita");

  drag = { type: "resize", el, citaId: el.dataset.id, startY: e.clientY, startH: el.offsetHeight };
  el.style.opacity = "0.85";
  document.body.style.cursor = "ns-resize";
  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup",   onResizeEnd);
}

function onResizeMove(e) {
  if (!drag || drag.type !== "resize") return;
  const dy   = e.clientY - drag.startY;
  const newH = Math.round((drag.startH + dy) / SLOT_PX) * SLOT_PX;
  drag.el.style.height = `${Math.max(SLOT_PX, newH)}px`;
}

async function onResizeEnd(e) {
  if (!drag || drag.type !== "resize") return;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup",   onResizeEnd);

  const altura   = parseInt(drag.el.style.height);
  const duracion = Math.round((altura / SLOT_PX) * SLOT_MIN);

  drag.el.style.opacity = "1";
  document.body.style.cursor = "";

  await actualizarCita(drag.citaId, { duracion_minutos: duracion });
  drag = null;
  vistaActual === "doctor" ? renderVistaSemana() : renderVistasDia();
}

/* =====================
   HELPERS DRAG
   ===================== */
function snapToSlot(px) {
  const slots = Math.round((px - HEADER_PX) / SLOT_PX);
  return Math.max(0, slots) * SLOT_PX + HEADER_PX;
}

function topToHora(top) {
  const slots = Math.round((top - HEADER_PX) / SLOT_PX);
  const mins  = HORA_INICIO * 60 + slots * SLOT_MIN;
  const hh    = Math.floor(mins / 60);
  const mm    = mins % 60;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}

async function actualizarCita(id, campos) {
  const cita = citas.find(c => c.id === id);
  if (!cita) return;
  const body = {
    paciente_id:      cita.paciente_id,
    doctor_id:        cita.doctor_id,
    fecha:            cita.fecha,
    hora:             cita.hora,
    duracion_minutos: cita.duracion_minutos || 30,
    especialidad:     cita.especialidad,
    estado:           cita.estado,
    motivo:           cita.motivo,
    ...campos
  };
  await fetch(`${CONFIG.API_URL}/citas/${id}`, {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

/* =====================
   MENÚ CONTEXTUAL CITAS
   ===================== */
function mostrarContextMenuCita(e, citaId) {
  cerrarContextMenu();
  citaContextId = citaId;

  const menu = document.createElement("div");
  menu.id = "context-menu";
  menu.className = "context-menu";
  menu.innerHTML = `
    <div class="context-item" onclick="copiarCita()">📋 Copiar cita</div>
    <div class="context-item" onclick="cortarCita()">✂️ Cortar cita</div>
    <div class="context-divider"></div>
    <div class="context-item context-danger" onclick="eliminarCitaContexto()">🗑️ Eliminar cita</div>
  `;

  document.body.appendChild(menu);
  posicionarMenu(menu, e);
  setTimeout(() => document.addEventListener("click", cerrarContextMenu, { once: true }), 0);
}

function posicionarMenu(menu, e) {
  const mw = menu.offsetWidth  || 190;
  const mh = menu.offsetHeight || 120;
  let x = e.clientX, y = e.clientY;
  if (x + mw > window.innerWidth)  x = window.innerWidth  - mw - 8;
  if (y + mh > window.innerHeight) y = window.innerHeight - mh - 8;
  menu.style.left = `${x}px`;
  menu.style.top  = `${y}px`;
}

function cerrarContextMenu() {
  const menu = document.getElementById("context-menu");
  if (menu) menu.remove();
}

function copiarCita() {
  citaCopiada = citas.find(c => c.id === citaContextId);
  citaCortada = null;
  cerrarContextMenu();
}

function cortarCita() {
  citaCortada = citas.find(c => c.id === citaContextId);
  citaCopiada = citaCortada;
  cerrarContextMenu();
}

async function pegarEnSlot(fecha, hora, doctorId) {
  cerrarContextMenu();
  if (!citaCopiada) return;

  abrirNuevaCita(fecha, hora, doctorId);
  setTimeout(() => {
    const h = document.getElementById("c-paciente");
    if (h) h.value = citaCopiada.paciente_id || "";
    const inp = document.getElementById("c-paciente-buscador");
    if (inp && citaCopiada.pacientes) inp.value = `${citaCopiada.pacientes.apellidos}, ${citaCopiada.pacientes.nombre}`;
    document.getElementById("c-especialidad").value = citaCopiada.especialidad || "";
    document.getElementById("c-duracion").value     = citaCopiada.duracion_minutos || 30;
    document.getElementById("c-motivo").value       = citaCopiada.motivo || "";
  }, 50);

  if (citaCortada) {
    await fetch(`${CONFIG.API_URL}/citas/${citaCortada.id}`, { method: "DELETE", credentials: "include" });
    citaCortada = null;
    citaCopiada = null;
  }
}

async function eliminarCitaContexto() {
  cerrarContextMenu();
  if (!citaContextId) return;
  if (!confirm("¿Eliminar esta cita?")) return;
  await fetch(`${CONFIG.API_URL}/citas/${citaContextId}`, { method: "DELETE", credentials: "include" });
  vistaActual === "doctor" ? renderVistaSemana() : renderVistasDia();
}

/* =====================
   MODAL CITA
   ===================== */
function abrirNuevaCita(fecha, hora, doctorId = null) {
  limpiarModal();
  document.getElementById("modal-titulo").textContent = "Nueva cita";
  document.getElementById("c-fecha").value = fecha;
  document.getElementById("c-hora").value  = hora;
  if (doctorId) document.getElementById("c-doctor").value = doctorId;
  else if (doctorSelec) document.getElementById("c-doctor").value = doctorSelec;
  document.getElementById("btn-eliminar-cita").classList.add("hidden");
  document.getElementById("modal-cita").classList.add("active");
}

function abrirEditarCita(id) {
  const cita = citas.find(c => c.id === id);
  if (!cita) return;
  limpiarModal();
  document.getElementById("modal-titulo").textContent = "Editar cita";
  document.getElementById("cita-id").value            = cita.id;
  // Rellenar buscador con nombre del paciente
  const hidden = document.getElementById("c-paciente");
  const input  = document.getElementById("c-paciente-buscador");
  if (hidden) hidden.value = cita.paciente_id || "";
  if (input && cita.pacientes) input.value = `${cita.pacientes.apellidos}, ${cita.pacientes.nombre}`;
  document.getElementById("c-doctor").value           = cita.doctor_id || "";
  document.getElementById("c-fecha").value            = cita.fecha || "";
  document.getElementById("c-hora").value             = cita.hora?.slice(0,5) || "";
  document.getElementById("c-duracion").value         = cita.duracion_minutos || 30;
  document.getElementById("c-especialidad").value     = cita.especialidad || "";
  document.getElementById("c-estado").value           = cita.estado || "pendiente";
  document.getElementById("c-motivo").value           = cita.motivo || "";
  document.getElementById("btn-eliminar-cita").classList.remove("hidden");
  document.getElementById("modal-cita").classList.add("active");
}

function cerrarModal() {
  document.getElementById("modal-cita").classList.remove("active");
  limpiarModal();
}

function limpiarModal() {
  ["cita-id","c-fecha","c-hora","c-motivo"].forEach(id => document.getElementById(id).value = "");
  // c-paciente es hidden, limpiar también el input visible del buscador
  const hidden = document.getElementById("c-paciente");
  const input  = document.getElementById("c-paciente-buscador");
  if (hidden) hidden.value = "";
  if (input)  input.value  = "";
  if (typeof buscadorCita !== "undefined" && buscadorCita) buscadorCita.seleccionado = null;
  document.getElementById("c-doctor").value        = "";
  document.getElementById("c-especialidad").value  = "";
  document.getElementById("c-estado").value        = "pendiente";
  document.getElementById("c-duracion").value      = "30";
  document.getElementById("modal-alert").innerHTML = "";
}

async function guardarCita() {
  const id          = document.getElementById("cita-id").value;
  const paciente_id = document.getElementById("c-paciente").value;
  const doctor_id   = document.getElementById("c-doctor").value;
  const fecha       = document.getElementById("c-fecha").value;
  const hora        = document.getElementById("c-hora").value;

  if (!paciente_id || !fecha || !hora) {
    document.getElementById("modal-alert").innerHTML =
      `<div class="alert alert-error">Paciente, fecha y hora son obligatorios</div>`;
    return;
  }

  const body = {
    paciente_id, doctor_id: doctor_id || null, fecha, hora,
    duracion_minutos: parseInt(document.getElementById("c-duracion").value),
    especialidad:     document.getElementById("c-especialidad").value || null,
    estado:           document.getElementById("c-estado").value || "pendiente",
    motivo:           document.getElementById("c-motivo").value.trim() || null
  };

  try {
    const url    = id ? `${CONFIG.API_URL}/citas/${id}` : `${CONFIG.API_URL}/citas`;
    const method = id ? "PUT" : "POST";
    const res    = await fetch(url, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    cerrarModal();
    vistaActual === "doctor" ? renderVistaSemana() : renderVistasDia();
  } catch (err) {
    document.getElementById("modal-alert").innerHTML =
      `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function eliminarCita() {
  const id = document.getElementById("cita-id").value;
  if (!id) return;
  await fetch(`${CONFIG.API_URL}/citas/${id}`, { method: "DELETE", credentials: "include" });
  cerrarModal();
  vistaActual === "doctor" ? renderVistaSemana() : renderVistasDia();
}

/* =====================
   EVENT LISTENERS
   ===================== */
function initEventListeners() {
  document.querySelectorAll(".btn-vista").forEach(btn => {
    btn.addEventListener("click", () => {
      vistaActual = btn.dataset.vista;
      document.querySelectorAll(".btn-vista").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("controles-doctor").classList.toggle("hidden", vistaActual !== "doctor");
      document.getElementById("controles-dia").classList.toggle("hidden", vistaActual !== "dia");
      vistaActual === "dia" ? renderVistasDia() : renderVistaSemana();
    });
  });

  document.getElementById("sel-doctor").addEventListener("change", e => {
    doctorSelec = e.target.value;
    if (doctorSelec) renderVistaSemana();
  });

  document.getElementById("sel-fecha").addEventListener("change", e => {
    fechaSelec = new Date(e.target.value + "T12:00:00");
    renderVistasDia();
  });

  document.getElementById("btn-semana-ant").addEventListener("click", () => {
    semanaOffset--; actualizarSemanaLabel();
    if (doctorSelec) renderVistaSemana();
  });
  document.getElementById("btn-semana-sig").addEventListener("click", () => {
    semanaOffset++; actualizarSemanaLabel();
    if (doctorSelec) renderVistaSemana();
  });

  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
  document.getElementById("btn-guardar").addEventListener("click", guardarCita);
  document.getElementById("btn-eliminar-cita").addEventListener("click", eliminarCita);
  document.getElementById("modal-cita").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModal();
  });

  // Modal bloqueo
  document.getElementById("btn-bloqueo-cancelar").addEventListener("click", () => {
    document.getElementById("modal-bloqueo").classList.remove("active");
  });
  document.getElementById("btn-bloqueo-guardar").addEventListener("click", guardarBloqueo);
  document.getElementById("modal-bloqueo").addEventListener("click", e => {
    if (e.target === e.currentTarget) document.getElementById("modal-bloqueo").classList.remove("active");
  });
}

/* =====================
   HELPERS FECHA
   ===================== */
function getLunesSemana(offset = 0) {
  const hoy  = new Date();
  const dia  = hoy.getDay();
  const diff = (dia === 0 ? -6 : 1 - dia) + offset * 7;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  lunes.setHours(0,0,0,0);
  return lunes;
}

function formatDateISO(date) {
  return date.toISOString().split("T")[0];
}

function actualizarSemanaLabel() {
  const lunes   = getLunesSemana(semanaOffset);
  const viernes = new Date(lunes); viernes.setDate(viernes.getDate() + 4);
  document.getElementById("label-semana").textContent =
    `${lunes.getDate()}/${lunes.getMonth()+1} – ${viernes.getDate()}/${viernes.getMonth()+1}/${viernes.getFullYear()}`;
}
/* =====================
   LÍNEA DE HORA ACTUAL
   ===================== */
function actualizarLineaHora() {
  document.querySelectorAll(".linea-hora-actual").forEach(el => el.remove());
  const ahora = new Date();
  const hh = ahora.getHours(), mm = ahora.getMinutes();
  if (hh < HORA_INICIO || hh >= HORA_FIN) return;
  const top = ((hh - HORA_INICIO) * 60 + mm) / SLOT_MIN * SLOT_PX + HEADER_PX;
  const horaStr = `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
  document.querySelectorAll(".agenda-col").forEach(col => {
    const linea = document.createElement("div");
    linea.className = "linea-hora-actual";
    linea.style.top = `${top}px`;
    linea.dataset.hora = horaStr;
    col.appendChild(linea);
  });
}

function iniciarLineaHora() {
  actualizarLineaHora();
  setInterval(actualizarLineaHora, 60000);
}

/* =====================
   BUSCADOR PACIENTES EN MODAL
   ===================== */
let buscadorCita = null;

function initBuscadorCita() {
  if (document.getElementById("c-paciente-buscador")) {
    buscadorCita = new PacienteBuscador("c-paciente-buscador", (paciente) => {
      const h = document.getElementById("c-paciente");
      if (h) h.value = paciente.id;
    });
  }
}

// La línea de hora se actualiza por el observer y el intervalo