/* =============================================
   DENTALRAÚL — presupuestos.js
   ============================================= */

let presupuestos = [];
let catalogo     = [];
let pacientes    = [];
let lineas       = [];
let filtroEstado = "";
let dientesPorLinea = {};

const DIENTES_SUP = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const DIENTES_INF = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await Promise.all([cargarPresupuestos(), cargarCatalogo(), cargarPacientes()]);
  initListeners();

  const params = new URLSearchParams(window.location.search);
  const pacienteParam = params.get("paciente");
  if (pacienteParam) {
    const lista = presupuestos.filter(p => p.paciente_id === pacienteParam);
    renderTablaLista(lista);
    setTimeout(() => {
      const sel = document.getElementById("pres-paciente");
      if (sel) sel.value = pacienteParam;
    }, 100);
  }
});

async function cargarPresupuestos() {
  const res    = await fetch(`${CONFIG.API_URL}/presupuestos`, { credentials: "include" });
  presupuestos = await res.json();
  renderTabla();
}

async function cargarCatalogo() {
  const res = await fetch(`${CONFIG.API_URL}/catalogo/activos`, { credentials: "include" });
  catalogo  = await res.json();
}

let buscadorPresupuestos = null;

async function cargarPacientes() {
  buscadorPresupuestos = new PacienteBuscador("pres-paciente-input", (p) => {
    document.getElementById("pres-paciente").value = p.id;
  });
}

function filtrar() {
  if (!filtroEstado) return presupuestos;
  return presupuestos.filter(p => p.estado === filtroEstado);
}

function renderTablaLista(lista) {
  const tbody = document.getElementById("tbody-presupuestos");
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No hay presupuestos para este paciente</p></div></td></tr>`;
    return;
  }
  const backup = presupuestos;
  presupuestos = lista;
  filtroEstado = "";
  renderTabla();
  presupuestos = backup;
}

function renderTabla() {
  const tbody = document.getElementById("tbody-presupuestos");
  const lista = filtrar();
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No hay presupuestos</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td><strong>${p.pacientes?.nombre} ${p.pacientes?.apellidos}</strong></td>
      <td>${formatFecha(p.fecha)}</td>
      <td class="text-muted">${p.notas || "—"}</td>
      <td><strong>${parseFloat(p.total||0).toFixed(2)} €</strong></td>
      <td><span class="badge badge-${p.estado}">${labelEstado(p.estado)}</span></td>
      <td>
        <div class="acciones">
          <button class="btn btn-secondary btn-sm" onclick="verDetalle('${p.id}')">Ver</button>
          <button class="btn btn-secondary btn-sm" onclick="exportarPresupuestoPDF('${p.id}')">PDF</button>
          ${p.estado === "borrador" ? `<button class="btn btn-primary btn-sm" onclick="cambiarEstado('${p.id}','enviado')">Enviar</button>` : ""}
          ${p.estado === "enviado" ? `
            <button class="btn btn-success btn-sm" onclick="aceptarPresupuesto('${p.id}')">Aceptar</button>
            <button class="btn btn-danger btn-sm" onclick="cambiarEstado('${p.id}','rechazado')">Rechazar</button>
          ` : ""}
          ${["borrador","rechazado"].includes(p.estado) ? `<button class="btn btn-danger btn-sm" onclick="eliminar('${p.id}')">Eliminar</button>` : ""}
        </div>
      </td>
    </tr>
  `).join("");
}

function initListeners() {
  document.getElementById("btn-nuevo").addEventListener("click", abrirModal);
  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
  document.getElementById("btn-guardar").addEventListener("click", guardar);
  document.getElementById("detalle-close").addEventListener("click", () => {
    document.getElementById("modal-detalle").classList.remove("active");
  });
  document.getElementById("modal-presupuesto").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModal();
  });
  document.getElementById("modal-detalle").addEventListener("click", e => {
    if (e.target === e.currentTarget) document.getElementById("modal-detalle").classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      filtroEstado = tab.dataset.estado;
      renderTabla();
    });
  });
}

function abrirModal() {
  lineas = [];
  dientesPorLinea = {};
  document.getElementById("pres-paciente").value = "";
  const inp = document.getElementById("pres-paciente-input");
  if (inp) inp.value = "";
  if (buscadorPresupuestos) buscadorPresupuestos.seleccionado = null;
  document.getElementById("pres-notas").value = "";
  document.getElementById("modal-alert").innerHTML  = "";
  document.getElementById("lineas-container").innerHTML = "";
  document.getElementById("total-presupuesto").textContent = "0.00 €";
  añadirLinea();
  document.getElementById("modal-presupuesto").classList.add("active");
}

function cerrarModal() {
  document.getElementById("modal-presupuesto").classList.remove("active");
}

function renderMiniOdonto(idx) {
  const sel = dientesPorLinea[idx] || new Set();
  const renderFila = (dientes) => dientes.map(num => {
    const activo = sel.has(num) ? "activo" : "";
    return `<div class="mini-diente ${activo}" onclick="toggleMiniDiente(${idx},${num})" title="${num}">${num}</div>`;
  }).join("");
  return `<div class="mini-odonto">
    <div class="mini-fila">${renderFila(DIENTES_SUP)}</div>
    <div class="mini-sep"></div>
    <div class="mini-fila">${renderFila(DIENTES_INF)}</div>
    <div class="mini-seleccion" id="mini-sel-${idx}">
      ${sel.size ? (() => {
        const esGlobal = lineas[idx]?.modo === "global";
        const precio = parseFloat(lineas[idx]?.precio)||0;
        const total = esGlobal ? precio : sel.size * precio;
        return `Dientes: <strong>${[...sel].sort((a,b)=>a-b).join(", ")}</strong> · Total: <strong>${total.toFixed(2)} €</strong>`;
      })() : "Ningún diente seleccionado"}
    </div>
  </div>`;
}

function toggleMiniDiente(idx, num) {
  if (!dientesPorLinea[idx]) dientesPorLinea[idx] = new Set();
  const sel = dientesPorLinea[idx];
  if (sel.has(num)) sel.delete(num); else sel.add(num);
  lineas[idx].dientes = [...sel].join(", ");
  const container = document.getElementById(`mini-odonto-${idx}`);
  if (container) container.innerHTML = renderMiniOdonto(idx);
  calcularTotal();
}

function añadirLinea() {
  const idx = lineas.length;
  lineas.push({ catalogo_id:"", nombre:"", precio:0, dientes:"", cuadrante:"", modo:"individual" });
  dientesPorLinea[idx] = new Set();
  const opts = catalogo.map(t =>
    `<option value="${t.id}" data-precio="${t.precio}" data-nombre="${t.nombre}">${t.categoria?`[${t.categoria}] `:""}${t.nombre} — ${parseFloat(t.precio).toFixed(2)}€</option>`
  ).join("");
  const div = document.createElement("div");
  div.className = "linea-row-wrap";
  div.id = `linea-wrap-${idx}`;
  div.innerHTML = `
    <div class="linea-row">
      <div>
        <label>Tratamiento *</label>
        <select onchange="onSelectTratamiento(${idx}, this)">
          <option value="">Seleccionar...</option>
          ${opts}
        </select>
      </div>
      <div>
        <label>Cuadrante (opcional)</label>
        <select onchange="lineas[${idx}].cuadrante=this.value">
          <option value="">—</option>
          <option>Superior derecho</option>
          <option>Superior izquierdo</option>
          <option>Inferior izquierdo</option>
          <option>Inferior derecho</option>
          <option>Boca completa</option>
        </select>
      </div>
      <div>
        <label>Precio por diente (€) *</label>
        <input type="number" step="0.01" min="0" placeholder="0.00" id="precio-linea-${idx}"
          oninput="lineas[${idx}].precio=parseFloat(this.value)||0; calcularTotal(); actualizarMiniInfo(${idx})">
      </div>
      <button class="btn-eliminar-linea" onclick="eliminarLinea(${idx})">✕</button>
    </div>
    <div id="mini-odonto-${idx}">${renderMiniOdonto(idx)}</div>
    <div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.4rem;padding:0.35rem 0.5rem;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);">
      <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Modo:</span>
      <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.78rem;cursor:pointer;">
        <input type="radio" name="modo-${idx}" id="modo-ind-${idx}" value="individual" checked onchange="lineas[${idx}].modo='individual'">
        Un precio por diente
      </label>
      <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.78rem;cursor:pointer;">
        <input type="radio" name="modo-${idx}" id="modo-glob-${idx}" value="global" onchange="lineas[${idx}].modo='global'">
        Precio global
      </label>
    </div>
    <hr style="border:none;border-top:1px solid var(--border);margin:0.5rem 0;">
  `;
  document.getElementById("lineas-container").appendChild(div);
}

function actualizarMiniInfo(idx) {
  const container = document.getElementById(`mini-odonto-${idx}`);
  if (container) container.innerHTML = renderMiniOdonto(idx);
}

function onSelectTratamiento(idx, sel) {
  const opt = sel.options[sel.selectedIndex];
  lineas[idx].catalogo_id = sel.value;
  lineas[idx].nombre      = opt.dataset.nombre || "";
  const precio = parseFloat(opt.dataset.precio) || 0;
  lineas[idx].precio = precio;
  const inp = document.getElementById(`precio-linea-${idx}`);
  if (inp) inp.value = precio.toFixed(2);
  actualizarMiniInfo(idx);
  calcularTotal();
}

function eliminarLinea(idx) {
  const el = document.getElementById(`linea-wrap-${idx}`);
  if (el) el.remove();
  lineas[idx] = null;
  delete dientesPorLinea[idx];
  calcularTotal();
}

function calcularTotal() {
  const total = lineas.filter(Boolean).reduce((s, l) => {
    const sel = dientesPorLinea[lineas.indexOf(l)];
    const esGlobal = l.modo === "global";
    const numDientes = (!esGlobal && sel && sel.size > 0) ? sel.size : 1;
    return s + (parseFloat(l.precio)||0) * numDientes;
  }, 0);
  document.getElementById("total-presupuesto").textContent = `${total.toFixed(2)} €`;
}

async function guardar() {
  const paciente_id = document.getElementById("pres-paciente").value;
  const notas       = document.getElementById("pres-notas").value.trim();
  if (!paciente_id) {
    document.getElementById("modal-alert").innerHTML = `<div class="alert alert-error">Selecciona un paciente</div>`;
    return;
  }
  const lineasValidas = lineas.map((l, idx) => l ? { ...l, idx } : null).filter(Boolean).filter(l => l.nombre);
  if (!lineasValidas.length) {
    document.getElementById("modal-alert").innerHTML = `<div class="alert alert-error">Añade al menos un tratamiento</div>`;
    return;
  }
  const body = {
    paciente_id, notas: notas || null, estado: "borrador",
    lineas: lineasValidas.map(l => {
      const sel = dientesPorLinea[l.idx];
      const dientesArr = sel && sel.size > 0 ? [...sel].sort((a,b)=>a-b) : null;
      return { catalogo_id: l.catalogo_id || null, nombre: l.nombre, precio: parseFloat(l.precio) || 0, dientes_afectados: dientesArr, cuadrante: l.cuadrante || null, modo: l.modo || "individual" };
    })
  };
  const res = await fetch(`${CONFIG.API_URL}/presupuestos`, {
    method:"POST", credentials:"include",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const d = await res.json();
    document.getElementById("modal-alert").innerHTML = `<div class="alert alert-error">${d.error}</div>`;
    return;
  }
  cerrarModal();
  await cargarPresupuestos();
}

async function verDetalle(id) {
  const res  = await fetch(`${CONFIG.API_URL}/presupuestos/${id}`, { credentials:"include" });
  const pres = await res.json();
  const paciente = `${pres.pacientes?.nombre} ${pres.pacientes?.apellidos}`;
  const creador  = pres.usuarios ? `${pres.usuarios.nombre} ${pres.usuarios.apellidos}` : "—";
  document.getElementById("detalle-titulo").textContent = `Presupuesto — ${paciente}`;
  const lineasExpandidas = [];
  (pres.presupuesto_lineas||[]).forEach(l => {
    const da = l.dientes_afectados;
    const dientes = da ? (Array.isArray(da) ? da : Object.values(da)) : [];
    if (dientes.length > 1) {
      dientes.forEach(d => lineasExpandidas.push({ ...l, _diente: d }));
    } else {
      lineasExpandidas.push({ ...l, _diente: dientes[0] || null });
    }
  });
  document.getElementById("detalle-body").innerHTML = `
    <div class="flex-between mb-1">
      <div><span class="text-muted">Fecha:</span> <strong>${formatFecha(pres.fecha)}</strong></div>
      <span class="badge badge-${pres.estado}">${labelEstado(pres.estado)}</span>
    </div>
    <div class="mb-1"><span class="text-muted">Creado por:</span> ${creador}</div>
    ${pres.notas ? `<div class="mb-1"><span class="text-muted">Notas:</span> ${pres.notas}</div>` : ""}
    <div class="detalle-lineas">
      ${lineasExpandidas.map(l => `
        <div class="detalle-linea">
          <div>
            <div class="detalle-linea-nombre">${l.nombre}</div>
            <div class="detalle-linea-sub">${l._diente ? `Diente ${l._diente}` : l.cuadrante ? `${l.cuadrante}` : ""}</div>
          </div>
          <div class="detalle-linea-precio">${parseFloat(l.precio).toFixed(2)} €</div>
        </div>
      `).join("")}
      <div class="detalle-total">
        <span>Total</span>
        <span>${parseFloat(pres.total||0).toFixed(2)} €</span>
      </div>
    </div>
  `;
  const footer = document.getElementById("detalle-footer");
  footer.innerHTML = `<button class="btn btn-secondary" onclick="exportarPresupuestoPDF('${id}')">Descargar PDF</button>`;
  if (pres.estado === "borrador") {
    footer.innerHTML += `<button class="btn btn-primary" onclick="cambiarEstado('${id}','enviado');document.getElementById('modal-detalle').classList.remove('active')">Marcar como enviado</button>`;
  } else if (pres.estado === "enviado") {
    footer.innerHTML += `
      <button class="btn btn-success" onclick="aceptarPresupuesto('${id}');document.getElementById('modal-detalle').classList.remove('active')">Aceptar</button>
      <button class="btn btn-danger" onclick="cambiarEstado('${id}','rechazado');document.getElementById('modal-detalle').classList.remove('active')">Rechazar</button>
    `;
  }
  document.getElementById("modal-detalle").classList.add("active");
}

async function cambiarEstado(id, estado) {
  await fetch(`${CONFIG.API_URL}/presupuestos/${id}/estado`, {
    method:"PATCH", credentials:"include",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ estado })
  });
  await cargarPresupuestos();
}

async function aceptarPresupuesto(id) {
  if (!confirm("¿Aceptar este presupuesto? Se crearán los tratamientos pendientes para el paciente.")) return;
  await fetch(`${CONFIG.API_URL}/presupuestos/${id}/aceptar`, { method:"PATCH", credentials:"include" });
  await cargarPresupuestos();
}

async function eliminar(id) {
  if (!confirm("¿Eliminar este presupuesto?")) return;
  await fetch(`${CONFIG.API_URL}/presupuestos/${id}`, { method:"DELETE", credentials:"include" });
  await cargarPresupuestos();
}

function labelEstado(e) {
  return { borrador:"Borrador", enviado:"Enviado", aceptado:"Aceptado", rechazado:"Rechazado" }[e] || e;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-ES", { day:"numeric", month:"short", year:"numeric" });
}