/* =============================================
   DENTALRAÚL — paciente-detalle.js
   ============================================= */

const params      = new URLSearchParams(window.location.search);
const pacienteId  = params.get("id");
let paciente      = null;
let historiales   = [];
let pagos         = [];
let doctores      = [];
let usuarioActual = null;
let denticionActual = "adulto";
let dientesSel    = new Set();
let modoDirecto   = false;
let catalogoTratamientos = [];

const DIENTES_ADULTO = {
  superior: [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],
  inferior: [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
};
const DIENTES_NINO = {
  superior: [55,54,53,52,51,61,62,63,64,65],
  inferior: [85,84,83,82,81,71,72,73,74,75]
};

document.addEventListener("DOMContentLoaded", async () => {
  if (!pacienteId) { window.location.href = "/pacientes.html"; return; }
  await loadLayout();
  const res = await fetch(`${CONFIG.API_URL}/auth/me`, { credentials: "include" });
  const { usuario } = await res.json();
  usuarioActual = usuario;
  await Promise.all([
    cargarPaciente(), cargarDoctores(), cargarHistoriales(),
    cargarPagos(), cargarAntecedentes(), cargarPresupuestosPaciente(),
    cargarDocumentos(), cargarPeriodontogramas()
  ]);
  renderOdontograma();
  initTabs();
  initModalListeners();
});

/* ===================== CARGA ===================== */
async function cargarPaciente() {
  const res = await fetch(`${CONFIG.API_URL}/pacientes/${pacienteId}`, { credentials: "include" });
  paciente  = await res.json();
  const iniciales = `${paciente.nombre[0]}${paciente.apellidos[0]}`.toUpperCase();
  document.getElementById("paciente-iniciales").textContent = iniciales;
  document.getElementById("paciente-nombre").textContent    = `${paciente.nombre} ${paciente.apellidos}`;
  document.getElementById("paciente-dni").textContent       = paciente.dni || "Sin DNI";
  document.getElementById("paciente-telefono").textContent  = paciente.telefono || "Sin teléfono";
  document.getElementById("paciente-email").textContent     = paciente.email || "Sin email";
  if (paciente.fecha_nacimiento)
    document.getElementById("paciente-edad").textContent = `${calcularEdad(paciente.fecha_nacimiento)} años`;
  document.title = `${paciente.nombre} ${paciente.apellidos} — DentalRaúl`;
}

async function cargarDoctores() {
  const [resDoc, resCat] = await Promise.all([
    fetch(`${CONFIG.API_URL}/usuarios/doctores`, { credentials: "include" }),
    fetch(`${CONFIG.API_URL}/catalogo/activos`, { credentials: "include" })
  ]);
  doctores  = await resDoc.json();
  catalogoTratamientos = await resCat.json();
  const selects = ["trat-doctor", "comp-trat-doctor"];
  selects.forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    doctores.forEach(d => {
      sel.innerHTML += `<option value="${d.id}">${d.nombre} ${d.apellidos}${d.especialidad ? ` — ${d.especialidad}` : ""}</option>`;
    });
  });
}

async function cargarHistoriales() {
  const res   = await fetch(`${CONFIG.API_URL}/historiales/paciente/${pacienteId}`, { credentials: "include" });
  historiales = await res.json();
  document.getElementById("stat-tratamientos").textContent = historiales.length;
  renderHistorialOdonto();
  renderTablaTratamientos();
}

async function cargarPagos() {
  const res = await fetch(`${CONFIG.API_URL}/pagos/paciente/${pacienteId}`, { credentials: "include" });
  pagos     = await res.json();
  const totalPagado    = pagos.filter(p => p.estado === "pagado").reduce((s,p) => s + parseFloat(p.importe||0), 0);
  const totalPendiente = pagos.filter(p => p.estado === "pendiente").reduce((s,p) => s + parseFloat(p.importe||0), 0);
  document.getElementById("stat-pagado").textContent    = `${totalPagado.toFixed(2)} €`;
  document.getElementById("stat-pendiente").textContent = `${totalPendiente.toFixed(2)} €`;
  renderPagos();
}

async function cargarAntecedentes() {
  const res  = await fetch(`${CONFIG.API_URL}/antecedentes/${pacienteId}`, { credentials: "include" });
  const data = await res.json();
  if (!data) return;
  document.getElementById("ant-enfermedades").value  = data.enfermedades  || "";
  document.getElementById("ant-alergias").value      = data.alergias      || "";
  document.getElementById("ant-medicacion").value    = data.medicacion    || "";
  document.getElementById("ant-operaciones").value   = data.operaciones   || "";
  document.getElementById("ant-habitos").value       = data.habitos       || "";
  document.getElementById("ant-observaciones").value = data.observaciones || "";
}

/* ===================== ODONTOGRAMA ===================== */
function renderOdontograma() {
  const dientes = denticionActual === "adulto" ? DIENTES_ADULTO : DIENTES_NINO;
  const esNino  = denticionActual === "nino";
  const el      = document.getElementById("odontograma");

  let html = `<div style="display:flex;justify-content:space-between;width:100%;padding:0 4px;font-size:0.68rem;color:var(--text-muted);font-weight:600;"><span>← Der</span><span>Izq →</span></div>`;
  html += `<div class="odonto-fila odonto-fila-superior">`;
  dientes.superior.forEach(num => {
    const sel = dientesSel.has(num) ? "seleccionado" : "";
    const trat = historiales.filter(h => {
      const da = h.dientes_afectados;
      return da && (Array.isArray(da) ? da.includes(num) : Object.values(da).includes(num));
    });
    const hasTrat = trat.length > 0 ? "con-tratamiento" : "";
    html += `<div class="diente ${esNino?"nino":""} ${sel} ${hasTrat}" onclick="toggleDiente(${num})" title="${num}${hasTrat ? ` — ${trat.map(t=>t.tratamiento).join(", ")}` : ""}">
      <div class="diente-numero">${num}</div>
      <div class="diente-grafico"></div>
    </div>`;
  });
  html += `</div><div class="odonto-separador"></div>`;
  html += `<div class="odonto-fila odonto-fila-inferior">`;
  dientes.inferior.forEach(num => {
    const sel = dientesSel.has(num) ? "seleccionado" : "";
    const trat = historiales.filter(h => {
      const da = h.dientes_afectados;
      return da && (Array.isArray(da) ? da.includes(num) : Object.values(da).includes(num));
    });
    const hasTrat = trat.length > 0 ? "con-tratamiento" : "";
    html += `<div class="diente ${esNino?"nino":""} ${sel} ${hasTrat}" onclick="toggleDiente(${num})" title="${num}${hasTrat ? ` — ${trat.map(t=>t.tratamiento).join(", ")}` : ""}">
      <div class="diente-grafico"></div>
      <div class="diente-numero">${num}</div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
  actualizarSeleccionLabel();
}

function toggleDiente(num) {
  if (dientesSel.has(num)) dientesSel.delete(num); else dientesSel.add(num);
  renderOdontograma();
}

function cambiarDenticion(tipo) {
  denticionActual = tipo;
  dientesSel.clear();
  document.getElementById("btn-adulto").classList.toggle("active", tipo === "adulto");
  document.getElementById("btn-nino").classList.toggle("active", tipo === "nino");
  renderOdontograma();
}

function seleccionarCuadrante(cuadrante) {
  const dientes = denticionActual === "adulto" ? DIENTES_ADULTO : DIENTES_NINO;
  if (cuadrante === 0) {
    [...dientes.superior, ...dientes.inferior].forEach(n => dientesSel.add(n));
  } else {
    const mitad = Math.floor(dientes.superior.length / 2);
    const grupos = { 1: dientes.superior.slice(0, mitad), 2: dientes.superior.slice(mitad), 3: dientes.inferior.slice(mitad), 4: dientes.inferior.slice(0, mitad) };
    (grupos[cuadrante] || []).forEach(n => dientesSel.add(n));
  }
  renderOdontograma();
}

function limpiarSeleccion() { dientesSel.clear(); renderOdontograma(); }

function actualizarSeleccionLabel() {
  const label  = document.getElementById("dientes-seleccionados-label");
  const btnAdd = document.getElementById("btn-nuevo-tratamiento");
  if (dientesSel.size === 0) { label.textContent = "Ninguno"; btnAdd.disabled = true; }
  else { label.textContent = [...dientesSel].sort((a,b) => a-b).join(", "); btnAdd.disabled = false; }
}

/* ===================== HISTORIAL ODONTO ===================== */
function renderHistorialOdonto() {
  const el = document.getElementById("historial-odonto");
  if (!historiales.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>Sin tratamientos. Selecciona un diente.</p></div>`;
    return;
  }
  el.innerHTML = historiales.slice(0,5).map(h => {
    const doctor = doctores.find(d => d.id === h.doctor_id);
    const da = h.dientes_afectados;
    const dientes = da ? (Array.isArray(da) ? da : Object.values(da)) : [];
    const estadoBadge = badgeEstadoTrat(h.estado_tratamiento);
    return `<div class="historial-mini">
      <div class="historial-mini-header">
        <strong>${h.tratamiento || "—"}</strong>
        <span class="badge ${estadoBadge.cls}">${estadoBadge.label}</span>
      </div>
      <div class="historial-mini-meta">
        ${doctor ? `<span class="historial-doctor"> ${doctor.nombre} ${doctor.apellidos}</span>` : ""}
        ${dientes.map(d => `<span class="historial-diente-tag">${d}</span>`).join("")}
        <span class="historial-fecha">${formatFecha(h.fecha)}</span>
      </div>
    </div>`;
  }).join("");
}

/* ===================== TABLA TRATAMIENTOS (estilo Gesden) ===================== */
function renderTablaTratamientos() {
  const tbody = document.getElementById("tbody-tratamientos");
  if (!historiales.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon"></div><p>No hay tratamientos</p></div></td></tr>`;
    return;
  }

  // Ordenar: pendientes primero, luego en_curso, luego completados
  const orden = { pendiente: 0, en_curso: 1, completado: 2 };
  const sorted = [...historiales].sort((a,b) => (orden[a.estado_tratamiento||"pendiente"]||0) - (orden[b.estado_tratamiento||"pendiente"]||0));

  tbody.innerHTML = sorted.map(h => {
    const doctor = doctores.find(d => d.id === h.doctor_id);
    const pago   = pagos.find(p => p.historial_id === h.id);
    const da     = h.dientes_afectados;
    const dientes = da ? (Array.isArray(da) ? da : Object.values(da)) : [];
    const dientesStr = dientes.length ? dientes.join(", ") : h.cuadrante || "—";
    const estado = h.estado_tratamiento || "pendiente";
    const estadoBadge = badgeEstadoTrat(estado);
    const canEdit = usuarioActual?.rol !== "invitado";

    // Fila con color de fondo según estado
    const rowStyle = estado === "completado" ? 'style="opacity:0.7;background:#f8fffe;"' : estado === "pendiente" ? 'style="background:#fffbf0;"' : "";

    return `<tr ${rowStyle}>
      <td><span class="trat-dientes">${dientesStr}</span></td>
      <td><strong>${h.tratamiento || "—"}</strong></td>
      <td>${doctor ? `${doctor.nombre} ${doctor.apellidos}` : "—"}</td>
      <td>${formatFecha(h.fecha)}</td>
      <td class="text-muted" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${h.descripcion||""}">${h.descripcion || "—"}</td>
      <td>${h.presupuesto ? `<strong>${parseFloat(h.presupuesto).toFixed(2)} €</strong>` : "—"}</td>
      <td><span class="badge ${estadoBadge.cls}">${estadoBadge.label}</span></td>
      <td>${pago ? `<span class="badge ${pago.estado==="pagado"?"badge-paid":"badge-pending"}">${pago.estado==="pagado"?"Pagado":"Pendiente"}</span>` : `<span class="badge badge-info">Sin pago</span>`}</td>
      <td>
        ${canEdit ? `<div class="acciones">
          ${estado === "pendiente" ? `<button class="btn btn-secondary btn-sm" onclick="cambiarEstadoTrat('${h.id}','en_curso')" title="Marcar en curso">En curso</button>` : ""}
          ${estado === "en_curso" ? `<button class="btn btn-success btn-sm" onclick="abrirModalCompletar('${h.id}')" title="Completar">Completar</button>` : ""}
          ${estado === "completado" ? `<span class="badge badge-paid">Completado</span>` : ""}
          <button class="btn btn-secondary btn-sm" onclick="editarTratamiento('${h.id}')">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarTratamiento('${h.id}')">Eliminar</button>
          ${pago && pago.estado === "pendiente" ? `<button class="btn btn-success btn-sm" onclick="marcarPagado('${pago.id}')" title="Marcar pagado">Cobrar</button>` : ""}
        </div>` : "—"}
      </td>
    </tr>`;
  }).join("");
}

function badgeEstadoTrat(estado) {
  const map = {
    pendiente:  { cls: "badge-pending",   label: "Pendiente" },
    en_curso:   { cls: "badge-en_consulta", label: "En curso" },
    completado: { cls: "badge-paid",      label: "Completado" }
  };
  return map[estado] || map.pendiente;
}

async function cambiarEstadoTrat(id, nuevoEstado) {
  await fetch(`${CONFIG.API_URL}/historiales/${id}`, {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado_tratamiento: nuevoEstado })
  });
  await cargarHistoriales();
}

/* Modal para completar tratamiento con descripción */
function abrirModalCompletar(id) {
  const h = historiales.find(h => h.id === id);
  if (!h) return;
  document.getElementById("comp-trat-id").value          = id;
  document.getElementById("comp-trat-nombre").textContent = h.tratamiento || "Tratamiento";
  document.getElementById("comp-trat-descripcion").value  = h.descripcion || "";
  document.getElementById("comp-trat-fecha").value        = new Date().toISOString().split("T")[0];
  document.getElementById("comp-trat-doctor").value       = h.doctor_id || usuarioActual?.id || "";
  document.getElementById("comp-trat-precio").value       = h.presupuesto || "";
  document.getElementById("modal-completar").classList.add("active");
}

async function guardarCompletar() {
  const id          = document.getElementById("comp-trat-id").value;
  const descripcion = document.getElementById("comp-trat-descripcion").value.trim();
  const fecha       = document.getElementById("comp-trat-fecha").value;
  const doctor_id   = document.getElementById("comp-trat-doctor").value || null;
  const precio      = parseFloat(document.getElementById("comp-trat-precio").value) || null;

  // Marcar tratamiento como completado
  await fetch(`${CONFIG.API_URL}/historiales/${id}`, {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estado_tratamiento: "completado",
      descripcion: descripcion || null,
      fecha,
      doctor_id,
      presupuesto: precio
    })
  });

  // Generar pago pendiente si hay precio y no existe ya un pago para este tratamiento
  const pagoExistente = pagos.find(p => p.historial_id === id);
  if (!pagoExistente && precio && precio > 0) {
    await fetch(`${CONFIG.API_URL}/pagos`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paciente_id:  pacienteId,
        historial_id: id,
        importe:      precio,
        estado:       "pendiente"
      })
    });
  }

  document.getElementById("modal-completar").classList.remove("active");
  await Promise.all([cargarHistoriales(), cargarPagos()]);
  renderOdontograma();
}

/* ===================== RENDER PAGOS ===================== */
function renderPagos() {
  const tbody = document.getElementById("tbody-pagos");
  if (!pagos.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-state-icon"></div><p>No hay pagos</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = pagos.map(p => {
    const h = historiales.find(h => h.id === p.historial_id);
    return `<tr>
      <td>${h?.tratamiento || "—"}</td>
      <td><strong>${parseFloat(p.importe).toFixed(2)} €</strong></td>
      <td><span class="badge ${p.estado==="pagado"?"badge-paid":"badge-pending"}">${p.estado==="pagado"?"Pagado":"Pendiente"}</span></td>
      <td><div class="acciones">
        ${p.estado==="pendiente" ? `<button class="btn btn-success btn-sm" onclick="marcarPagado('${p.id}')">Pagado</button>` : ""}
        <button class="btn btn-danger btn-sm" onclick="eliminarPago('${p.id}')">Eliminar</button>
      </div></td>
    </tr>`;
  }).join("");
}

/* ===================== MODAL TRATAMIENTO ===================== */
function abrirModalTratamiento() {
  modoDirecto = false;
  limpiarModalTrat();
  const tags = [...dientesSel].sort((a,b)=>a-b).map(d=>`<span class="diente-tag">${d}</span>`).join("");
  document.getElementById("trat-dientes-label").innerHTML = tags || "Ninguno";
  document.getElementById("modal-tratamiento").classList.add("active");
}

function abrirModalTratamientoDirecto() {
  modoDirecto = true;
  dientesSel.clear();
  limpiarModalTrat();
  document.getElementById("trat-dientes-label").innerHTML = `<span style="color:var(--text-muted);font-size:0.82rem;">Sin selección — puedes indicar cuadrante</span>`;
  document.getElementById("modal-tratamiento").classList.add("active");
}

function limpiarModalTrat() {
  document.getElementById("trat-id").value          = "";
  document.getElementById("trat-nombre").value      = "";
  const modoInd = document.getElementById("modo-individual");
  if (modoInd) modoInd.checked = true;
  document.getElementById("trat-doctor").value      = usuarioActual?.id || "";
  document.getElementById("trat-fecha").value       = new Date().toISOString().split("T")[0];
  document.getElementById("trat-cuadrante").value   = "";
  document.getElementById("trat-descripcion").value = "";
  document.getElementById("trat-presupuesto").value = "";
  document.getElementById("trat-pago-estado").value = "pendiente";
  document.getElementById("modal-trat-alert").innerHTML = "";
  document.getElementById("modal-trat-titulo").textContent = "Nuevo tratamiento";
  document.getElementById("btn-trat-eliminar").classList.add("hidden");
}

async function editarTratamiento(id) {
  const h = historiales.find(h => h.id === id);
  if (!h) return;
  modoDirecto = true;
  document.getElementById("trat-id").value          = h.id;
  document.getElementById("trat-nombre").value      = h.tratamiento || "";
  document.getElementById("trat-doctor").value      = h.doctor_id || "";
  document.getElementById("trat-fecha").value       = h.fecha || new Date().toISOString().split("T")[0];
  document.getElementById("trat-cuadrante").value   = h.cuadrante || "";
  document.getElementById("trat-descripcion").value = h.descripcion || "";
  document.getElementById("trat-presupuesto").value = h.presupuesto || "";
  document.getElementById("modal-trat-titulo").textContent = "Editar tratamiento";
  document.getElementById("btn-trat-eliminar").classList.remove("hidden");
  document.getElementById("modal-trat-alert").innerHTML = "";
  const da = h.dientes_afectados;
  const dientes = da ? (Array.isArray(da) ? da : Object.values(da)) : [];
  document.getElementById("trat-dientes-label").innerHTML = dientes.map(d=>`<span class="diente-tag">${d}</span>`).join("") || "Sin dientes";
  const pago = pagos.find(p => p.historial_id === id);
  document.getElementById("trat-pago-estado").value = pago?.estado || "pendiente";
  document.getElementById("modal-tratamiento").classList.add("active");
}

async function guardarTratamiento() {
  const id          = document.getElementById("trat-id").value;
  const tratamiento = document.getElementById("trat-nombre").value.trim();
  const doctor_id   = document.getElementById("trat-doctor").value || null;
  const fecha       = document.getElementById("trat-fecha").value || new Date().toISOString().split("T")[0];
  const cuadrante   = document.getElementById("trat-cuadrante").value;
  const descripcion = document.getElementById("trat-descripcion").value.trim();
  const presupuesto = parseFloat(document.getElementById("trat-presupuesto").value) || null;
  const pagoEstado  = document.getElementById("trat-pago-estado").value;
  const dientesArr  = [...dientesSel].sort((a,b)=>a-b);

  if (!tratamiento) {
    document.getElementById("modal-trat-alert").innerHTML = `<div class="alert alert-error">El nombre del tratamiento es obligatorio</div>`;
    return;
  }

  try {
    if (id) {
      // Editar tratamiento existente — un solo registro
      const bodyH = {
        tratamiento, doctor_id,
        cuadrante: cuadrante || null, descripcion: descripcion || null,
        presupuesto, fecha
      };
      const resH = await fetch(`${CONFIG.API_URL}/historiales/${id}`, {
        method:"PUT", credentials:"include",
        headers:{"Content-Type":"application/json"}, body:JSON.stringify(bodyH)
      });
      const historial = await resH.json();
      if (!resH.ok) throw new Error(historial.error);

      if (presupuesto && presupuesto > 0) {
        const pagoExistente = pagos.find(p => p.historial_id === id);
        if (pagoExistente) {
          await fetch(`${CONFIG.API_URL}/pagos/${pagoExistente.id}`, { method:"PUT", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ importe:presupuesto, estado:pagoEstado }) });
        }
      }
    } else {
      // Nuevo tratamiento — modo individual o global
      const modoIndividual = document.getElementById("modo-individual")?.checked !== false;
      const dientesACrear = (modoIndividual && dientesArr.length > 1)
        ? dientesArr.map(d => [d])
        : [dientesArr.length ? dientesArr : null];

      for (const dientes of dientesACrear) {
        const bodyH = {
          paciente_id: pacienteId, tratamiento, doctor_id,
          cuadrante: cuadrante || null, descripcion: descripcion || null,
          presupuesto, fecha, estado_tratamiento: "pendiente",
          dientes_afectados: dientes
        };
        const resH = await fetch(`${CONFIG.API_URL}/historiales`, {
          method:"POST", credentials:"include",
          headers:{"Content-Type":"application/json"}, body:JSON.stringify(bodyH)
        });
        const historial = await resH.json();
        if (!resH.ok) throw new Error(historial.error);
      }
    }

    document.getElementById("modal-tratamiento").classList.remove("active");
    dientesSel.clear();
    await Promise.all([cargarHistoriales(), cargarPagos()]);
    renderOdontograma();
  } catch (err) {
    document.getElementById("modal-trat-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function eliminarTratamiento(id) {
  if (!confirm("¿Eliminar este tratamiento y su pago asociado?")) return;
  const pago = pagos.find(p => p.historial_id === id);
  if (pago) await fetch(`${CONFIG.API_URL}/pagos/${pago.id}`, { method:"DELETE", credentials:"include" });
  await fetch(`${CONFIG.API_URL}/historiales/${id}`, { method:"DELETE", credentials:"include" });
  await Promise.all([cargarHistoriales(), cargarPagos()]);
  renderOdontograma();
}

async function marcarPagado(pagoId) {
  await fetch(`${CONFIG.API_URL}/pagos/${pagoId}`, { method:"PUT", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ estado:"pagado" }) });
  await cargarPagos();
  renderTablaTratamientos();
}

async function eliminarPago(id) {
  if (!confirm("¿Eliminar este pago?")) return;
  await fetch(`${CONFIG.API_URL}/pagos/${id}`, { method:"DELETE", credentials:"include" });
  await cargarPagos();
  renderTablaTratamientos();
}

/* ===================== ANTECEDENTES ===================== */
async function guardarAntecedentes() {
  const body = {
    enfermedades:  document.getElementById("ant-enfermedades").value.trim() || null,
    alergias:      document.getElementById("ant-alergias").value.trim() || null,
    medicacion:    document.getElementById("ant-medicacion").value.trim() || null,
    operaciones:   document.getElementById("ant-operaciones").value.trim() || null,
    habitos:       document.getElementById("ant-habitos").value.trim() || null,
    observaciones: document.getElementById("ant-observaciones").value.trim() || null
  };
  try {
    const res = await fetch(`${CONFIG.API_URL}/antecedentes/${pacienteId}`, { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    if (!res.ok) throw new Error("Error al guardar");
    const alertEl = document.getElementById("ant-alert");
    alertEl.innerHTML = `<div class="alert alert-success">Guardado correctamente</div>`;
    setTimeout(() => alertEl.innerHTML = "", 3000);
  } catch (err) {
    document.getElementById("ant-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

/* ===================== PRESUPUESTOS ===================== */
async function cargarPresupuestosPaciente() {
  const res  = await fetch(`${CONFIG.API_URL}/presupuestos/paciente/${pacienteId}`, { credentials:"include" });
  const data = await res.json();
  renderPresupuestosPaciente(data);
}

function renderPresupuestosPaciente(lista) {
  const tbody = document.getElementById("tbody-presupuestos-paciente");
  if (!lista || !lista.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon"></div><p>No hay presupuestos</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(p => {
    const lineas = p.presupuesto_lineas || [];
    return `<tr>
      <td>${formatFecha(p.fecha)}</td>
      <td class="text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${lineas.map(l=>l.nombre).join(", ") || "—"}</td>
      <td><strong>${parseFloat(p.total||0).toFixed(2)} €</strong></td>
      <td><span class="badge badge-${p.estado}">${labelPresupuesto(p.estado)}</span></td>
      <td><div class="acciones"><a href="/presupuestos.html" class="btn btn-secondary btn-sm">Ver</a></div></td>
    </tr>`;
  }).join("");
}

function labelPresupuesto(e) {
  return { borrador:"Borrador", enviado:"Enviado", aceptado:"Aceptado", rechazado:"Rechazado" }[e] || e;
}

/* ===================== DOCUMENTOS ===================== */
let todosDocumentos = [];

async function cargarDocumentos() {
  const res  = await fetch(`${CONFIG.API_URL}/documentos/paciente/${pacienteId}`, { credentials:"include" });
  todosDocumentos = await res.json();
  renderDocumentos(todosDocumentos);
}

function filtrarDocumentos() {
  const tipo = document.getElementById("filtro-doc-tipo")?.value || "";
  const filtrados = tipo ? todosDocumentos.filter(d => d.tipo === tipo) : todosDocumentos;
  renderDocumentos(filtrados);
}

function renderDocumentos(docs) {
  const el = document.getElementById("documentos-lista");
  if (!docs || !docs.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>No hay documentos subidos</p></div>`;
    return;
  }
  el.innerHTML = docs.map(d => `
    <div class="documento-card">
      <div class="documento-nombre">${d.nombre}</div>
      <span class="documento-tipo">${d.tipo}</span>
      <span class="documento-fecha">${formatFecha(d.created_at)}</span>
      <div class="documento-acciones">
        <button class="btn btn-secondary btn-sm" onclick="verDocumento('${d.storage_path}')">Ver</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarDocumento('${d.id}')">Eliminar</button>
      </div>
    </div>
  `).join("");
}

async function verDocumento(path) {
  const res  = await fetch(`${CONFIG.API_URL}/documentos/url?path=${encodeURIComponent(path)}`, { credentials:"include" });
  const data = await res.json();
  window.open(data.url, "_blank");
}

async function eliminarDocumento(id) {
  if (!confirm("¿Eliminar este documento?")) return;
  await fetch(`${CONFIG.API_URL}/documentos/${id}`, { method:"DELETE", credentials:"include" });
  await cargarDocumentos();
}

function abrirSubidaDoc() {
  document.getElementById("form-subida-doc").classList.remove("hidden");
  document.getElementById("doc-nombre").value  = "";
  document.getElementById("doc-archivo").value = "";
  document.getElementById("doc-alert").innerHTML = "";
}

function cerrarSubidaDoc() { document.getElementById("form-subida-doc").classList.add("hidden"); }

async function subirDocumento() {
  const nombre  = document.getElementById("doc-nombre").value.trim();
  const tipo    = document.getElementById("doc-tipo").value;
  const archivo = document.getElementById("doc-archivo").files[0];
  if (!nombre || !archivo) {
    document.getElementById("doc-alert").innerHTML = `<div class="alert alert-error">Nombre y archivo son obligatorios</div>`;
    return;
  }
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("nombre", nombre);
  formData.append("tipo", tipo);
  formData.append("paciente_id", pacienteId);
  try {
    const res  = await fetch(`${CONFIG.API_URL}/documentos/upload`, { method:"POST", credentials:"include", body:formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    cerrarSubidaDoc();
    await cargarDocumentos();
  } catch (err) {
    document.getElementById("doc-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

/* ===================== PERIODONTOGRAMAS ===================== */
let periodontogramas = [];

async function cargarPeriodontogramas() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/periodontogramas/paciente/${pacienteId}`, { credentials:"include" });
    periodontogramas = await res.json();
    renderListaPerio();
  } catch (err) { console.error("Error cargando periodontogramas:", err); }
}

function renderListaPerio() {
  const el = document.getElementById("perio-lista");
  if (!el) return;
  if (!periodontogramas.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>No hay periodontogramas. Crea uno nuevo.</p></div>`;
    return;
  }
  el.innerHTML = periodontogramas.map(p => {
    const doctor = p.usuarios ? `Dr. ${p.usuarios.nombre} ${p.usuarios.apellidos}` : "—";
    return `<div class="perio-lista-item" onclick="abrirPeriodontograma('${p.id}')">
      <div>
        <div class="perio-lista-fecha"> ${formatFecha(p.fecha)}</div>
        <div class="perio-lista-doctor">${doctor} ${p.notas ? `· ${p.notas}` : ""}</div>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();exportarPeriodontogramaPDF('${paciente?.nombre} ${paciente?.apellidos}','${p.fecha}','${p.notas||""}')">PDF</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();eliminarPerio('${p.id}')">Eliminar</button>
      </div>
    </div>`;
  }).join("");
}

function nuevoPeriodontograma() {
  periodoId = null;
  initDatosPeriodo();
  document.getElementById("perio-fecha").value = new Date().toISOString().split("T")[0];
  document.getElementById("perio-notas").value = "";
  document.getElementById("perio-editor-titulo").textContent = "Nuevo periodontograma";
  document.getElementById("perio-lista-view").classList.add("hidden");
  document.getElementById("perio-editor-view").classList.remove("hidden");
  renderPeriodontograma("perio-container");
}

async function abrirPeriodontograma(id) {
  const data = await cargarPeriodontograma(id);
  document.getElementById("perio-fecha").value = data.fecha || "";
  document.getElementById("perio-notas").value = data.notas || "";
  document.getElementById("perio-editor-titulo").textContent = `Periodontograma — ${formatFecha(data.fecha)}`;
  document.getElementById("perio-lista-view").classList.add("hidden");
  document.getElementById("perio-editor-view").classList.remove("hidden");
  renderPeriodontograma("perio-container");
  cargarDatosEnFormulario();
}

function volverListaPerio() {
  document.getElementById("perio-editor-view").classList.add("hidden");
  document.getElementById("perio-comparacion-view").classList.add("hidden");
  document.getElementById("perio-lista-view").classList.remove("hidden");
}

async function guardarPerio() {
  const fecha = document.getElementById("perio-fecha").value;
  const notas = document.getElementById("perio-notas").value.trim();
  const alertEl = document.getElementById("perio-alert");
  try {
    await guardarPeriodontograma(pacienteId, usuarioActual?.id, notas, fecha);
    alertEl.innerHTML = `<div class="alert alert-success">Guardado correctamente</div>`;
    setTimeout(() => alertEl.innerHTML = "", 3000);
    await cargarPeriodontogramas();
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function eliminarPerio(id) {
  if (!confirm("¿Eliminar este periodontograma?")) return;
  await fetch(`${CONFIG.API_URL}/periodontogramas/${id}`, { method:"DELETE", credentials:"include" });
  await cargarPeriodontogramas();
}

function abrirComparacion() {
  if (periodontogramas.length < 2) { alert("Necesitas al menos 2 periodontogramas para comparar."); return; }
  document.getElementById("perio-lista-view").classList.add("hidden");
  document.getElementById("perio-editor-view").classList.add("hidden");
  document.getElementById("perio-comparacion-view").classList.remove("hidden");
  const selA = document.getElementById("comp-sel-a");
  const selB = document.getElementById("comp-sel-b");
  const opts = periodontogramas.map(p => `<option value="${p.id}">${formatFecha(p.fecha)} ${p.notas ? `— ${p.notas}` : ""}</option>`).join("");
  selA.innerHTML = opts;
  selB.innerHTML = opts;
  selA.value = periodontogramas[periodontogramas.length - 1].id;
  selB.value = periodontogramas[0].id;
  generarComparacion();
}

function volverDesdeComparacion() {
  document.getElementById("perio-comparacion-view").classList.add("hidden");
  document.getElementById("perio-lista-view").classList.remove("hidden");
  if (typeof graficaComp !== "undefined" && graficaComp) { graficaComp.destroy(); graficaComp = null; }
}

/* ===================== BUSCADOR CATÁLOGO ===================== */
function buscarEnCatalogo(q) {
  const dropdown = document.getElementById("catalogo-dropdown");
  if (!q || q.length < 2) { dropdown.style.display = "none"; return; }

  const resultados = catalogoTratamientos.filter(t =>
    t.nombre.toLowerCase().includes(q.toLowerCase()) ||
    (t.categoria || "").toLowerCase().includes(q.toLowerCase())
  ).slice(0, 8);

  if (!resultados.length) { dropdown.style.display = "none"; return; }

  dropdown.innerHTML = resultados.map(t => `
    <div onclick="seleccionarTratamientoCatalogo('${t.id}')"
      style="padding:0.5rem 0.75rem;cursor:pointer;border-bottom:1px solid var(--border-light);font-size:0.82rem;transition:background 0.1s;"
      onmouseover="this.style.background='var(--primary-light)'"
      onmouseout="this.style.background=''">
      <div style="font-weight:600;">${t.nombre}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);">${t.categoria || "General"} · ${parseFloat(t.precio).toFixed(2)} €</div>
    </div>
  `).join("");
  dropdown.style.display = "block";

  // Cerrar al clicar fuera
  setTimeout(() => {
    document.addEventListener("click", function cerrar(e) {
      if (!dropdown.contains(e.target) && e.target.id !== "trat-nombre") {
        dropdown.style.display = "none";
        document.removeEventListener("click", cerrar);
      }
    });
  }, 0);
}

function seleccionarTratamientoCatalogo(id) {
  const t = catalogoTratamientos.find(t => t.id === id);
  if (!t) return;
  document.getElementById("trat-nombre").value      = t.nombre;
  document.getElementById("trat-presupuesto").value = parseFloat(t.precio).toFixed(2);
  document.getElementById("catalogo-dropdown").style.display = "none";
}

/* ===================== TABS & LISTENERS ===================== */
function initTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.remove("hidden");
    });
  });
}

function initModalListeners() {
  document.getElementById("modal-trat-close").addEventListener("click", () => document.getElementById("modal-tratamiento").classList.remove("active"));
  document.getElementById("btn-trat-cancelar").addEventListener("click", () => document.getElementById("modal-tratamiento").classList.remove("active"));
  document.getElementById("btn-trat-guardar").addEventListener("click", guardarTratamiento);
  document.getElementById("btn-trat-eliminar").addEventListener("click", () => {
    const id = document.getElementById("trat-id").value;
    document.getElementById("modal-tratamiento").classList.remove("active");
    eliminarTratamiento(id);
  });
  document.getElementById("modal-tratamiento").addEventListener("click", e => {
    if (e.target === e.currentTarget) document.getElementById("modal-tratamiento").classList.remove("active");
  });
  document.getElementById("btn-guardar-antecedentes").addEventListener("click", guardarAntecedentes);

  // Modal completar
  document.getElementById("modal-completar").addEventListener("click", e => {
    if (e.target === e.currentTarget) document.getElementById("modal-completar").classList.remove("active");
  });
  document.getElementById("btn-completar-cancelar").addEventListener("click", () => document.getElementById("modal-completar").classList.remove("active"));
  document.getElementById("btn-completar-guardar").addEventListener("click", guardarCompletar);
}

/* ===================== HELPERS ===================== */
function calcularEdad(fechaNac) {
  const hoy = new Date(), nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-ES", { day:"numeric", month:"short", year:"numeric" });
}

/* =====================
   RECETA MÉDICA
   ===================== */
let medicamentosReceta = [];

function abrirModalReceta() {
  medicamentosReceta = [];
  document.getElementById("receta-medicamentos").innerHTML = "";
  document.getElementById("receta-observaciones").value = "";
  document.getElementById("receta-alert").innerHTML = "";

  const sel = document.getElementById("receta-doctor");
  sel.innerHTML = '<option value="">Seleccionar doctor...</option>';
  doctores.forEach(d => {
    sel.innerHTML += `<option value="${d.nombre} ${d.apellidos}">${d.nombre} ${d.apellidos}${d.especialidad ? ` — ${d.especialidad}` : ""}</option>`;
  });
  if (usuarioActual) {
    sel.value = `${usuarioActual.nombre} ${usuarioActual.apellidos}`;
  }

  añadirMedicamento();
  document.getElementById("modal-receta").classList.add("active");
}

function añadirMedicamento() {
  const idx = medicamentosReceta.length;
  medicamentosReceta.push({ nombre: "", dosis: "", pauta: "", duracion: "" });

  const container = document.getElementById("receta-medicamentos");
  const div = document.createElement("div");
  div.id = `med-${idx}`;
  div.style.cssText = "background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.75rem;margin-bottom:0.5rem;";
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
      <strong style="font-size:0.85rem;color:var(--primary);">Medicamento ${idx + 1}</strong>
      ${idx > 0 ? `<button class="btn btn-danger btn-sm" onclick="eliminarMedicamento(${idx})">✕</button>` : ""}
    </div>
    <div class="form-row">
      <div class="form-group" style="margin-bottom:0.5rem;">
        <label>Nombre del medicamento *</label>
        <input type="text" placeholder="Ej: Amoxicilina 500mg"
          oninput="medicamentosReceta[${idx}].nombre=this.value">
      </div>
      <div class="form-group" style="margin-bottom:0.5rem;">
        <label>Dosis</label>
        <input type="text" placeholder="Ej: 500mg"
          oninput="medicamentosReceta[${idx}].dosis=this.value">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="margin-bottom:0;">
        <label>Pauta</label>
        <input type="text" placeholder="Ej: 1 comprimido cada 8 horas"
          oninput="medicamentosReceta[${idx}].pauta=this.value">
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Duración</label>
        <input type="text" placeholder="Ej: 7 días"
          oninput="medicamentosReceta[${idx}].duracion=this.value">
      </div>
    </div>
  `;
  container.appendChild(div);
}

function eliminarMedicamento(idx) {
  const el = document.getElementById(`med-${idx}`);
  if (el) el.remove();
  medicamentosReceta[idx] = null;
}

function imprimirReceta() {
  const validos = medicamentosReceta.filter(m => m && m.nombre);
  if (!validos.length) {
    document.getElementById("receta-alert").innerHTML =
      `<div class="alert alert-error">Añade al menos un medicamento</div>`;
    return;
  }

  generarRecetaPDF({
    paciente:      `${paciente?.nombre} ${paciente?.apellidos}`,
    fecha:         new Date().toLocaleDateString("es-ES"),
    doctor:        document.getElementById("receta-doctor").value,
    colegiado:     document.getElementById("receta-colegiado").value,
    observaciones: document.getElementById("receta-observaciones").value.trim(),
    medicamentos:  validos
  });

  document.getElementById("modal-receta").classList.remove("active");
}