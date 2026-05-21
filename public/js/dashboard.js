/* =============================================
   DENTALRAÚL — dashboard.js
   ============================================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await loadDashboard();
});

async function loadDashboard() {
  await Promise.all([
    loadStats(),
    loadCitasHoy(),
    loadUltimosPacientes(),
    loadPagosPendientes()
  ]);
}

// Tarjetas de resumen
async function loadStats() {
  try {
    const [pacientesRes, citasRes, pagosRes] = await Promise.all([
      fetch(`${CONFIG.API_URL}/pacientes`, { credentials: "include" }),
      fetch(`${CONFIG.API_URL}/citas/hoy`, { credentials: "include" }),
      fetch(`${CONFIG.API_URL}/pagos/pendientes`, { credentials: "include" })
    ]);

    const pacientes = await pacientesRes.json();
    const citas     = await citasRes.json();
    const pagos     = await pagosRes.json();

    document.getElementById("total-pacientes").textContent = pacientes.length ?? "—";
    document.getElementById("citas-hoy").textContent       = citas.length ?? "—";
    document.getElementById("pagos-pendientes").textContent = pagos.length ?? "—";

    // Ingresos del mes (pagos pagados este mes)
    const pagosRes2  = await fetch(`${CONFIG.API_URL}/pagos`, { credentials: "include" });
    const todosPagos = await pagosRes2.json();
    const mesActual  = new Date().toISOString().slice(0, 7); // "2025-12"
    const ingresos   = todosPagos
      .filter(p => p.estado === "pagado" && p.fecha?.startsWith(mesActual))
      .reduce((sum, p) => sum + parseFloat(p.importe || 0), 0);

    document.getElementById("ingresos-mes").textContent = `${ingresos.toFixed(2)} €`;
  } catch (err) {
    console.error("Error cargando stats:", err);
  }
}

// Citas de hoy
async function loadCitasHoy() {
  try {
    const res   = await fetch(`${CONFIG.API_URL}/citas/hoy`, { credentials: "include" });
    const citas = await res.json();
    const el    = document.getElementById("citas-hoy-list");

    if (!citas.length) return;

    el.innerHTML = citas.map(c => `
      <div class="cita-item">
        <span class="cita-hora">${c.hora?.slice(0,5)}</span>
        <div class="cita-info">
          <div class="cita-paciente">${c.pacientes?.nombre} ${c.pacientes?.apellidos}</div>
          <div class="cita-especialidad">${c.especialidad || c.motivo || "Sin especificar"}</div>
        </div>
        <span class="cita-doctor">${c.usuarios?.nombre || ""}</span>
        <span class="badge ${badgeEstado(c.estado)}">${c.estado}</span>
      </div>
    `).join("");
  } catch (err) {
    console.error("Error cargando citas:", err);
  }
}

// Últimos pacientes
async function loadUltimosPacientes() {
  try {
    const res       = await fetch(`${CONFIG.API_URL}/pacientes`, { credentials: "include" });
    const pacientes = await res.json();
    const el        = document.getElementById("ultimos-pacientes");

    if (!pacientes.length) return;

    const ultimos = pacientes
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    el.innerHTML = ultimos.map(p => {
      const iniciales = `${p.nombre[0]}${p.apellidos[0]}`.toUpperCase();
      return `
        <div class="paciente-item">
          <div class="paciente-avatar">${iniciales}</div>
          <div class="paciente-info">
            <div class="paciente-nombre">${p.nombre} ${p.apellidos}</div>
            <div class="paciente-fecha">${formatFecha(p.created_at)}</div>
          </div>
          <a href="/paciente-detalle.html?id=${p.id}" class="btn btn-secondary btn-sm">Ver</a>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Error cargando pacientes:", err);
  }
}

// Pagos pendientes
async function loadPagosPendientes() {
  try {
    const res   = await fetch(`${CONFIG.API_URL}/pagos/pendientes`, { credentials: "include" });
    const pagos = await res.json();
    const el    = document.getElementById("pagos-pendientes-list");

    if (!pagos.length) return;

    el.innerHTML = pagos.slice(0, 6).map(p => `
      <div class="pago-item">
        <div>
          <div class="pago-paciente">${p.pacientes?.nombre} ${p.pacientes?.apellidos}</div>
          <div class="pago-fecha">${formatFecha(p.fecha)}</div>
        </div>
        <span class="pago-importe">${parseFloat(p.importe).toFixed(2)} €</span>
      </div>
    `).join("");
  } catch (err) {
    console.error("Error cargando pagos:", err);
  }
}

// Helpers
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