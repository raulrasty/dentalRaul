/* =============================================
   DENTALRAÚL — paciente-buscador.js
   Buscador reutilizable de pacientes
   ============================================= */

class PacienteBuscador {
  constructor(inputId, onSelect) {
    this.input    = document.getElementById(inputId);
    this.onSelect = onSelect;
    this.pacientes = [];
    this.dropdown  = null;
    this.seleccionado = null;

    if (!this.input) return;
    this.init();
  }

  async init() {
    // Cargar pacientes
    const res = await fetch(`${CONFIG.API_URL}/pacientes`, { credentials: "include" });
    this.pacientes = await res.json();
    this.pacientes.sort((a,b) => a.apellidos.localeCompare(b.apellidos));

    this.crearDropdown();
    this.bindEventos();
  }

  crearDropdown() {
    this.dropdown = document.createElement("div");
    this.dropdown.className = "paciente-dropdown";
    this.dropdown.style.display = "none";
    this.input.parentNode.style.position = "relative";
    this.input.parentNode.appendChild(this.dropdown);
  }

  bindEventos() {
    this.input.addEventListener("input", () => this.buscar());
    this.input.addEventListener("focus", () => {
      if (this.input.value.length > 0) this.buscar();
    });
    document.addEventListener("click", (e) => {
      if (!this.input.parentNode.contains(e.target)) this.cerrar();
    });
  }

  buscar() {
    const q = this.input.value.toLowerCase().trim();
    if (!q) { this.cerrar(); return; }

    const resultados = this.pacientes.filter(p =>
      `${p.nombre} ${p.apellidos}`.toLowerCase().includes(q) ||
      `${p.apellidos} ${p.nombre}`.toLowerCase().includes(q) ||
      (p.dni || "").toLowerCase().includes(q) ||
      (p.telefono || "").includes(q)
    ).slice(0, 8);

    if (!resultados.length) {
      this.dropdown.innerHTML = `<div class="paciente-dropdown-empty">No se encontraron pacientes</div>`;
    } else {
      this.dropdown.innerHTML = resultados.map(p => {
        const iniciales = `${p.nombre[0]}${p.apellidos[0]}`.toUpperCase();
        return `<div class="paciente-dropdown-item" data-id="${p.id}">
          <div class="paciente-drop-avatar">${iniciales}</div>
          <div class="paciente-drop-info">
            <span class="paciente-drop-nombre">${p.apellidos}, ${p.nombre}</span>
            <span class="paciente-drop-sub">${p.dni || ""} ${p.telefono ? `· ${p.telefono}` : ""}</span>
          </div>
        </div>`;
      }).join("");

      this.dropdown.querySelectorAll(".paciente-dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
          const paciente = this.pacientes.find(p => p.id === item.dataset.id);
          if (paciente) this.seleccionar(paciente);
        });
      });
    }

    this.dropdown.style.display = "block";
  }

  seleccionar(paciente) {
    this.seleccionado = paciente;
    this.input.value  = `${paciente.apellidos}, ${paciente.nombre}`;
    this.cerrar();
    if (this.onSelect) this.onSelect(paciente);
  }

  cerrar() {
    if (this.dropdown) this.dropdown.style.display = "none";
  }

  reset() {
    this.seleccionado = null;
    this.input.value  = "";
    this.cerrar();
  }

  getId() {
    return this.seleccionado?.id || null;
  }
}