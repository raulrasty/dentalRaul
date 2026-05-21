

let catalogo = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  await cargar();
  initListeners();
});

async function cargar() {
  const res = await fetch(`${CONFIG.API_URL}/catalogo`, { credentials: "include" });
  catalogo  = await res.json();
  renderTabla(catalogo);
}

function filtrar() {
  const categoria = document.getElementById("filtro-categoria").value;
  const buscar    = document.getElementById("filtro-buscar").value.toLowerCase().trim();
  return catalogo.filter(t => {
    if (categoria && t.categoria !== categoria) return false;
    if (buscar && !t.nombre.toLowerCase().includes(buscar) && !(t.descripcion||"").toLowerCase().includes(buscar)) return false;
    return true;
  });
}

function renderTabla(lista) {
  const tbody = document.getElementById("tbody-catalogo");
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon"></div><p>No hay tratamientos</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(t => `
    <tr>
      <td><span class="badge badge-info">${t.categoria || "General"}</span></td>
      <td><strong>${t.nombre}</strong></td>
      <td class="text-muted">${t.descripcion || "—"}</td>
      <td><strong>${parseFloat(t.precio).toFixed(2)} €</strong></td>
      <td><span class="badge ${t.activo ? "badge-activo" : "badge-inactivo"}">${t.activo ? "Activo" : "Inactivo"}</span></td>
      <td>
        <div class="acciones">
          <button class="btn btn-secondary btn-sm" onclick="editar('${t.id}')">Editar</button>
          <button class="btn ${t.activo ? "btn-danger" : "btn-success"} btn-sm" onclick="toggleActivo('${t.id}')">
            ${t.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function initListeners() {
  document.getElementById("btn-nuevo").addEventListener("click", () => abrirModal());
  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
  document.getElementById("btn-guardar").addEventListener("click", guardar);
  document.getElementById("modal-catalogo").addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModal();
  });
  document.getElementById("filtro-categoria").addEventListener("change", () => renderTabla(filtrar()));
  document.getElementById("filtro-buscar").addEventListener("input", () => renderTabla(filtrar()));
}

function abrirModal(t = null) {
  document.getElementById("cat-id").value          = t?.id || "";
  document.getElementById("cat-categoria").value   = t?.categoria || "";
  document.getElementById("cat-nombre").value      = t?.nombre || "";
  document.getElementById("cat-descripcion").value = t?.descripcion || "";
  document.getElementById("cat-precio").value      = t?.precio || "";
  document.getElementById("modal-titulo").textContent = t ? "Editar tratamiento" : "Nuevo tratamiento";
  document.getElementById("modal-alert").innerHTML = "";
  document.getElementById("modal-catalogo").classList.add("active");
}

function editar(id) {
  const t = catalogo.find(t => t.id === id);
  if (t) abrirModal(t);
}

function cerrarModal() {
  document.getElementById("modal-catalogo").classList.remove("active");
}

async function guardar() {
  const id          = document.getElementById("cat-id").value;
  const nombre      = document.getElementById("cat-nombre").value.trim();
  const precio      = parseFloat(document.getElementById("cat-precio").value);
  const categoria   = document.getElementById("cat-categoria").value;
  const descripcion = document.getElementById("cat-descripcion").value.trim();

  if (!nombre || isNaN(precio)) {
    document.getElementById("modal-alert").innerHTML =
      `<div class="alert alert-error">Nombre y precio son obligatorios</div>`;
    return;
  }

  const body   = { nombre, precio, categoria: categoria || null, descripcion: descripcion || null };
  const url    = id ? `${CONFIG.API_URL}/catalogo/${id}` : `${CONFIG.API_URL}/catalogo`;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method, credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const d = await res.json();
    document.getElementById("modal-alert").innerHTML = `<div class="alert alert-error">${d.error}</div>`;
    return;
  }

  cerrarModal();
  await cargar();
}

async function toggleActivo(id) {
  const t = catalogo.find(t => t.id === id);
  if (!t) return;
  const accion = t.activo ? "desactivar" : "activar";
  if (!confirm(`¿Quieres ${accion} este tratamiento?`)) return;
  await fetch(`${CONFIG.API_URL}/catalogo/${id}`, {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activo: !t.activo })
  });
  await cargar();
}