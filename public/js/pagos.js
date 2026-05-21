/* =============================================
   DENTALRAÚL — pagos.js
   ============================================= */

let pagos     = [];
let pacientes = [];
let tabActual = "todos";

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await Promise.all([cargarPagos(), cargarPacientes()]);
  initEventListeners();
});

async function cargarPagos() {
  const res = await fetch(`${CONFIG.API_URL}/pagos`, { credentials: "include" });
  pagos     = await res.json();
  calcularStats();
  renderTabla(filtrar(pagos));
}

let buscadorPagos = null;

async function cargarPacientes() {
  const res = await fetch(`${CONFIG.API_URL}/pacientes`, { credentials: "include" });
  pacientes = await res.json();
  buscadorPagos = new PacienteBuscador("p-paciente-input", (p) => {
    document.getElementById("p-paciente").value = p.id;
  });
}

function calcularStats() {
  const mes   = new Date().toISOString().slice(0,7);
  const pagados  = pagos.filter(p => p.estado === "pagado");
  const pendientes = pagos.filter(p => p.estado === "pendiente");

  const ingresosMes = pagados
    .filter(p => p.fecha?.startsWith(mes))
    .reduce((s, p) => s + parseFloat(p.importe), 0);

  const totalPendiente = pendientes.reduce((s, p) => s + parseFloat(p.importe), 0);

  document.getElementById("stat-mes").textContent            = `${ingresosMes.toFixed(2)} €`;
  document.getElementById("stat-pendiente-total").textContent = `${totalPendiente.toFixed(2)} €`;
  document.getElementById("stat-num-pendientes").textContent  = pendientes.length;
}

function filtrar(lista) {
  if (tabActual === "todos") return lista;
  return lista.filter(p => p.estado === tabActual);
}

function renderTabla(lista) {
  const tbody = document.getElementById("tbody-pagos");
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5">
      <div class="empty-state"><div class="empty-state-icon"></div><p>No hay pagos</p></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const paciente = p.pacientes ? `${p.pacientes.nombre} ${p.pacientes.apellidos}` : "—";
    const esPagado = p.estado === "pagado";
    return `
      <tr>
        <td>
          <a href="/paciente-detalle.html?id=${p.paciente_id}" style="color:var(--primary);font-weight:600;">
            ${paciente}
          </a>
        </td>
        <td>${formatFecha(p.fecha)}</td>
        <td><strong>${parseFloat(p.importe).toFixed(2)} €</strong></td>
        <td><span class="badge ${esPagado ? "badge-paid" : "badge-pending"}">${esPagado ? "Pagado" : "Pendiente"}</span></td>
        <td>
          <div class="acciones">
            ${!esPagado ? `<button class="btn btn-success btn-sm" onclick="marcarPagado('${p.id}')">Pagado</button>` : ""}
            <button class="btn btn-danger btn-sm" onclick="eliminarPago('${p.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function initEventListeners() {
  document.getElementById("btn-nuevo-pago").addEventListener("click", () => abrirModal());
  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
  document.getElementById("btn-guardar").addEventListener("click", guardarPago);
  document.getElementById("modal-pago").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModal();
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      tabActual = tab.dataset.tab;
      renderTabla(filtrar(pagos));
    });
  });
}

function abrirModal() {
  document.getElementById("pago-id").value  = "";
  document.getElementById("p-paciente").value = "";
  const inp = document.getElementById("p-paciente-input");
  if (inp) inp.value = "";
  if (buscadorPagos) buscadorPagos.seleccionado = null;
  document.getElementById("p-importe").value  = "";
  document.getElementById("p-estado").value   = "pendiente";
  document.getElementById("modal-alert").innerHTML = "";
  document.getElementById("modal-pago").classList.add("active");
}

function cerrarModal() {
  document.getElementById("modal-pago").classList.remove("active");
}

async function guardarPago() {
  const paciente_id = document.getElementById("p-paciente").value;
  const importe     = parseFloat(document.getElementById("p-importe").value);
  const estado      = document.getElementById("p-estado").value;

  if (!paciente_id || !importe || importe <= 0) {
    document.getElementById("modal-alert").innerHTML =
      `<div class="alert alert-error">Paciente e importe son obligatorios</div>`;
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_URL}/pagos`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paciente_id, importe, estado })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    cerrarModal();
    await cargarPagos();
  } catch (err) {
    document.getElementById("modal-alert").innerHTML =
      `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function marcarPagado(id) {
  await fetch(`${CONFIG.API_URL}/pagos/${id}`, {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "pagado" })
  });
  await cargarPagos();
}

async function eliminarPago(id) {
  if (!confirm("¿Eliminar este pago?")) return;
  await fetch(`${CONFIG.API_URL}/pagos/${id}`, { method: "DELETE", credentials: "include" });
  await cargarPagos();
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}