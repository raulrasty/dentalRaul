/* =============================================
   DENTALRAÚL — periodontograma.js
   ============================================= */

const DIENTES_SUP = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const DIENTES_INF = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const MOLARES     = [18,17,16,48,47,46,28,27,26,38,37,36];

let datosPeriodo  = {};   // datos actuales del formulario
let periodoId     = null; // id del periodontograma cargado
let graficaChart  = null; // instancia Chart.js

/* =====================
   INIT DATOS
   ===================== */
function initDatosPeriodo() {
  datosPeriodo = {};
  [...DIENTES_SUP, ...DIENTES_INF].forEach(num => {
    datosPeriodo[num] = {
      ausente:  false,
      implante: false,
      movilidad: 0,
      furca:    0,
      vestibular: {
        margen_gingival: [0,0,0],
        sondaje:         [0,0,0],
        recesion:        [0,0,0],
        sangrado:        [false,false,false],
        placa:           [false,false,false]
      },
      lingual: {
        margen_gingival: [0,0,0],
        sondaje:         [0,0,0],
        recesion:        [0,0,0],
        sangrado:        [false,false,false],
        placa:           [false,false,false]
      }
    };
  });
}

/* =====================
   RENDER TABLA
   ===================== */
function renderPeriodontograma(contenedorId) {
  const el = document.getElementById(contenedorId);

  el.innerHTML = `
    <div class="perio-leyenda">
      <span class="perio-leyenda-item"><span class="perio-leyenda-color" style="background:#d4f5e2"></span> 1-3mm (Sano)</span>
      <span class="perio-leyenda-item"><span class="perio-leyenda-color" style="background:#fef3cd"></span> 4-5mm (Leve)</span>
      <span class="perio-leyenda-item"><span class="perio-leyenda-color" style="background:#fde8e8"></span> 6-7mm (Moderado)</span>
      <span class="perio-leyenda-item"><span class="perio-leyenda-color" style="background:#dc2626"></span> ≥8mm (Severo)</span>
    </div>
    <div class="perio-wrapper">
      <table class="perio-tabla" id="perio-tabla">
        ${renderArcada(DIENTES_SUP, "superior")}
        <tr class="perio-separador"><td colspan="${DIENTES_SUP.length + 1}"></td></tr>
        ${renderArcada(DIENTES_INF, "inferior")}
      </table>
    </div>
    <div class="perio-grafica">
      <canvas id="perio-canvas" height="180"></canvas>
    </div>
  `;

  // Inicializar gráfica
  initGrafica();

  // Actualizar gráfica al cambiar cualquier valor
  el.querySelectorAll(".perio-input").forEach(input => {
    input.addEventListener("input", () => {
      // Solo números y guión
      input.value = input.value.replace(/[^0-9\-]/g, "");
      sincronizarDatos();
      actualizarColores();
      actualizarGrafica();
    });
  });
  el.querySelectorAll(".perio-select-single").forEach(sel => {
    sel.addEventListener("change", () => { sincronizarDatos(); });
  });
  el.querySelectorAll(".perio-sangrado input").forEach(cb => {
    cb.addEventListener("change", sincronizarDatos);
  });
}

function renderArcada(dientes, arcada) {
  const esSup = arcada === "superior";
  const filas = esSup ? filasSuperiores() : filasInferiores();
  return filas.map((fila, fi) => renderFila(fila, dientes, arcada, fi)).join("");
}

function filasSuperiores() {
  return [
    { key: "vest_placa",    label: "Placa V",        tipo: "placa3",   cara: "vestibular", campo: "placa" },
    { key: "vest_movilidad",label: "Movilidad",      tipo: "single",   cara: "vestibular", campo: "movilidad" },
    { key: "vest_furca",    label: "Furca",          tipo: "single",   cara: "vestibular", campo: "furca" },
    { key: "vest_sangrado", label: "Sangrado V",     tipo: "sangrado", cara: "vestibular", campo: "sangrado" },
    { key: "vest_margen",   label: "Margen V",       tipo: "triple",   cara: "vestibular", campo: "margen_gingival" },
    { key: "vest_sondaje",  label: "Sondaje V",      tipo: "triple",   cara: "vestibular", campo: "sondaje" },
    { key: "vest_recesion", label: "Recesión V",     tipo: "triple",   cara: "vestibular", campo: "recesion" },
    { key: "diente",        label: "Diente",         tipo: "diente" },
    { key: "ling_recesion", label: "Recesión P",     tipo: "triple",   cara: "lingual",    campo: "recesion" },
    { key: "ling_sondaje",  label: "Sondaje P",      tipo: "triple",   cara: "lingual",    campo: "sondaje" },
    { key: "ling_margen",   label: "Margen P",       tipo: "triple",   cara: "lingual",    campo: "margen_gingival" },
    { key: "ling_sangrado", label: "Sangrado P",     tipo: "sangrado", cara: "lingual",    campo: "sangrado" },
    { key: "ling_placa",    label: "Placa P",        tipo: "placa3",   cara: "lingual",    campo: "placa" },
  ];
}

function filasInferiores() {
  return [
    { key: "ling_placa",    label: "Placa L",        tipo: "placa3",   cara: "lingual",    campo: "placa" },
    { key: "ling_sangrado", label: "Sangrado L",    tipo: "sangrado", cara: "lingual",    campo: "sangrado" },
    { key: "ling_margen",   label: "Margen L",      tipo: "triple",   cara: "lingual",    campo: "margen_gingival" },
    { key: "ling_sondaje",  label: "Sondaje L",     tipo: "triple",   cara: "lingual",    campo: "sondaje" },
    { key: "ling_recesion", label: "Recesión L",    tipo: "triple",   cara: "lingual",    campo: "recesion" },
    { key: "diente",        label: "Diente",        tipo: "diente" },
    { key: "vest_recesion", label: "Recesión V",    tipo: "triple",   cara: "vestibular", campo: "recesion" },
    { key: "vest_sondaje",  label: "Sondaje V",     tipo: "triple",   cara: "vestibular", campo: "sondaje" },
    { key: "vest_margen",   label: "Margen V",      tipo: "triple",   cara: "vestibular", campo: "margen_gingival" },
    { key: "vest_sangrado", label: "Sangrado V",    tipo: "sangrado", cara: "vestibular", campo: "sangrado" },
    { key: "vest_furca",    label: "Furca",         tipo: "single",   cara: "vestibular", campo: "furca" },
    { key: "vest_movilidad",label: "Movilidad",     tipo: "single",   cara: "vestibular", campo: "movilidad" },
    { key: "vest_placa",    label: "Placa",         tipo: "placa3",   cara: "vestibular", campo: "placa" },
  ];
}

function renderFila(fila, dientes, arcada, fi) {
  if (fila.tipo === "diente") {
    return `<tr>
      <td class="perio-row-label">${fila.label}</td>
      ${dientes.map(num => {
        const d = datosPeriodo[num];
        const cls = `${d.ausente ? "ausente" : ""} ${d.implante ? "implante" : ""}`;
        return `<td class="perio-col ${cls}" id="col-${num}">
          <div class="perio-diente-num" onclick="toggleDienteMenu(${num})" title="Click para opciones">${num}</div>
        </td>`;
      }).join("")}
    </tr>`;
  }

  return `<tr>
    <td class="perio-row-label">${fila.label}</td>
    ${dientes.map(num => {
      const d   = datosPeriodo[num];
      const cls = `${d.ausente ? "ausente" : ""} ${d.implante ? "implante" : ""}`;

      if (fila.tipo === "triple") {
        const vals = d[fila.cara][fila.campo];
        return `<td class="perio-col ${cls}">
          <div class="perio-cell-3">
            ${[0,1,2].map(i => `<input class="perio-input ${fila.campo === "sondaje" ? "sondaje-input" : ""}"
              type="number" min="-10" max="15" step="1"
              value="${vals[i]}"
              data-num="${num}" data-cara="${fila.cara}" data-campo="${fila.campo}" data-idx="${i}"
              data-val="${vals[i]}">`).join("")}
          </div>
        </td>`;
      }

      if (fila.tipo === "sangrado") {
        const vals = d[fila.cara][fila.campo] || [false,false,false];
        return `<td class="perio-col ${cls}">
          <div class="perio-sangrado">
            ${[0,1,2].map(i => `<label class="perio-cb-wrapper">
              <input type="checkbox"
                data-num="${num}" data-cara="${fila.cara}" data-campo="sangrado" data-idx="${i}"
                ${vals[i] ? "checked" : ""}>
              <span class="perio-cb-visual"></span>
            </label>`).join("")}
          </div>
        </td>`;
      }

      if (fila.tipo === "placa3") {
        const vals = d[fila.cara][fila.campo] || [false,false,false];
        return `<td class="perio-col ${cls}">
          <div class="perio-placa">
            ${[0,1,2].map(i => `<label class="perio-cb-wrapper">
              <input type="checkbox" class="perio-placa-cb"
                data-num="${num}" data-cara="${fila.cara}" data-campo="placa" data-idx="${i}"
                ${vals[i] ? "checked" : ""}>
              <span class="perio-cb-visual"></span>
            </label>`).join("")}
          </div>
        </td>`;
      }

      if (fila.tipo === "single") {
        const val = fila.campo === "movilidad" || fila.campo === "furca"
          ? d[fila.campo]
          : d[fila.cara]?.[fila.campo] || 0;
        const mostrar = (fila.campo === "furca" && !MOLARES.includes(num)) ? false : true;
        const opcionesMF = [0,1,2,3].map(v => `<option value="${v}" ${val==v?"selected":""}>${v}</option>`).join("");
        return `<td class="perio-col ${cls}">
          ${mostrar ? `<select class="perio-select-single"
            data-num="${num}" data-campo="${fila.campo}">${opcionesMF}</select>` : ""}
        </td>`;
      }

      return `<td class="perio-col ${cls}"></td>`;
    }).join("")}
  </tr>`;
}

/* =====================
   TOGGLE AUSENTE/IMPLANTE
   ===================== */
function toggleDienteMenu(num) {
  // Crear menú contextual
  const existing = document.getElementById("diente-menu");
  if (existing) existing.remove();

  const d   = datosPeriodo[num];
  const menu = document.createElement("div");
  menu.id = "diente-menu";
  menu.className = "context-menu";
  menu.style.position = "fixed";
  menu.style.zIndex = "9999";
  menu.innerHTML = `
    <div class="context-item" onclick="setDienteEstado(${num},'ausente',${!d.ausente})">
      ${d.ausente ? "Marcar presente" : "❌ Marcar ausente"}
    </div>
    <div class="context-item" onclick="setDienteEstado(${num},'implante',${!d.implante})">
      ${d.implante ? "🦷 Quitar implante" : "🔩 Marcar implante"}
    </div>
  `;

  // Posicionar cerca del diente
  const colEl = document.getElementById(`col-${num}`);
  if (colEl) {
    const rect = colEl.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top  = `${rect.bottom + 4}px`;
  }

  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
}

function setDienteEstado(num, campo, valor) {
  datosPeriodo[num][campo] = valor;
  const menu = document.getElementById("diente-menu");
  if (menu) menu.remove();
  // Re-render solo la columna
  renderPeriodontograma("perio-container");
  cargarDatosEnFormulario();
}

/* =====================
   SINCRONIZAR DATOS
   ===================== */
function sincronizarDatos() {
  document.querySelectorAll(".perio-input, .perio-input-single").forEach(input => {
    const num   = parseInt(input.dataset.num);
    const cara  = input.dataset.cara;
    const campo = input.dataset.campo;
    const idx   = input.dataset.idx !== undefined ? parseInt(input.dataset.idx) : null;
    const val   = parseFloat(input.value) || 0;

    if (!datosPeriodo[num]) return;

    if (idx !== null && cara) {
      datosPeriodo[num][cara][campo][idx] = val;
    } else if (campo) {
      datosPeriodo[num][campo] = val;
    }
  });

  document.querySelectorAll(".perio-sangrado input[type='checkbox'], .perio-sangrado input").forEach(cb => {
    const num  = parseInt(cb.dataset.num);
    const cara = cb.dataset.cara;
    const idx  = parseInt(cb.dataset.idx);
    if (datosPeriodo[num] && cara) datosPeriodo[num][cara].sangrado[idx] = cb.checked;
  });

  document.querySelectorAll(".perio-placa-cb").forEach(cb => {
    const num  = parseInt(cb.dataset.num);
    const cara = cb.dataset.cara;
    const idx  = parseInt(cb.dataset.idx);
    if (datosPeriodo[num] && cara) datosPeriodo[num][cara].placa[idx] = cb.checked;
  });

  document.querySelectorAll(".perio-select-single").forEach(sel => {
    const num   = parseInt(sel.dataset.num);
    const campo = sel.dataset.campo;
    if (datosPeriodo[num]) datosPeriodo[num][campo] = parseInt(sel.value) || 0;
  });
}

function cargarDatosEnFormulario() {
  document.querySelectorAll(".perio-input, .perio-input-single").forEach(input => {
    const num   = parseInt(input.dataset.num);
    const cara  = input.dataset.cara;
    const campo = input.dataset.campo;
    const idx   = input.dataset.idx !== undefined ? parseInt(input.dataset.idx) : null;
    if (!datosPeriodo[num]) return;

    let val;
    if (idx !== null && cara) val = datosPeriodo[num][cara][campo][idx];
    else val = datosPeriodo[num][campo];
    input.value = val || 0;
  });

  document.querySelectorAll(".perio-sangrado input, .perio-placa-cb").forEach(cb => {
    const num   = parseInt(cb.dataset.num);
    const cara  = cb.dataset.cara;
    const campo = cb.dataset.campo;
    const idx   = parseInt(cb.dataset.idx);
    if (datosPeriodo[num] && cara && campo) {
      cb.checked = datosPeriodo[num][cara][campo]?.[idx] || false;
    }
  });

  document.querySelectorAll(".perio-select-single").forEach(sel => {
    const num   = parseInt(sel.dataset.num);
    const campo = sel.dataset.campo;
    if (datosPeriodo[num]) sel.value = datosPeriodo[num][campo] || 0;
  });

  actualizarColores();
  actualizarGrafica();
}

function actualizarColores() {
  document.querySelectorAll(".perio-input.sondaje-input").forEach(input => {
    const val = parseInt(input.value) || 0;
    input.dataset.val = val;
  });
}

/* =====================
   GRÁFICA
   ===================== */
function initGrafica() {
  const canvas = document.getElementById("perio-canvas");
  if (!canvas) return;

  if (graficaChart) graficaChart.destroy();

  const labelsSupV = DIENTES_SUP.flatMap(n => [`${n}-d`, `${n}-c`, `${n}-m`]);
  const labelsInfV = DIENTES_INF.flatMap(n => [`${n}-d`, `${n}-c`, `${n}-m`]);

  const sondajeSupV = DIENTES_SUP.flatMap(n => datosPeriodo[n].vestibular.sondaje);
  const sondajeInfV = DIENTES_INF.flatMap(n => datosPeriodo[n].vestibular.sondaje);

  graficaChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: [...labelsSupV, ...labelsInfV],
      datasets: [
        {
          label: "Sondaje Sup. Vestibular",
          data: [...sondajeSupV, ...Array(labelsInfV.length).fill(null)],
          borderColor: "#1a6bbd",
          backgroundColor: "rgba(26,107,189,0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3
        },
        {
          label: "Sondaje Inf. Vestibular",
          data: [...Array(labelsSupV.length).fill(null), ...sondajeInfV],
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top", labels: { font: { size: 11 } } },
        tooltip: { mode: "index" }
      },
      scales: {
        y: {
          reverse: true,
          min: 0, max: 12,
          title: { display: true, text: "mm" },
          grid: {
            color: ctx => {
              if (ctx.tick.value === 3) return "rgba(0,200,0,0.3)";
              if (ctx.tick.value === 6) return "rgba(255,165,0,0.3)";
              return "rgba(0,0,0,0.05)";
            }
          }
        },
        x: { ticks: { font: { size: 8 }, maxRotation: 90 } }
      }
    }
  });
}

function actualizarGrafica() {
  if (!graficaChart) return;
  const sondajeSupV = DIENTES_SUP.flatMap(n => datosPeriodo[n]?.vestibular?.sondaje || [0,0,0]);
  const sondajeInfV = DIENTES_INF.flatMap(n => datosPeriodo[n]?.vestibular?.sondaje || [0,0,0]);
  const len = DIENTES_SUP.length * 3;

  graficaChart.data.datasets[0].data = [...sondajeSupV, ...Array(len).fill(null)];
  graficaChart.data.datasets[1].data = [...Array(len).fill(null), ...sondajeInfV];
  graficaChart.update("none");
}

/* =====================
   GUARDAR / CARGAR
   ===================== */
async function guardarPeriodontograma(pacienteId, doctorId, notas, fecha) {
  sincronizarDatos();
  const body = {
    paciente_id: pacienteId,
    doctor_id:   doctorId,
    notas:       notas || null,
    fecha:       fecha || new Date().toISOString().split("T")[0],
    datos:       datosPeriodo
  };

  const url    = periodoId ? `${CONFIG.API_URL}/periodontogramas/${periodoId}` : `${CONFIG.API_URL}/periodontogramas`;
  const method = periodoId ? "PUT" : "POST";

  const res  = await fetch(url, {
    method, credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  periodoId = data.id;
  return data;
}

async function cargarPeriodontograma(id) {
  const res  = await fetch(`${CONFIG.API_URL}/periodontogramas/${id}`, { credentials: "include" });
  const data = await res.json();
  periodoId  = data.id;

  // Fusionar datos cargados con los iniciales
  initDatosPeriodo();
  Object.keys(data.datos || {}).forEach(num => {
    if (datosPeriodo[num]) {
      datosPeriodo[num] = { ...datosPeriodo[num], ...data.datos[num] };
    }
  });

  return data;
}

/* =====================
   EXPORTAR PDF
   ===================== */
async function exportarPeriodontogramaPDF(pacienteNombre, fecha, notas) {
  sincronizarDatos();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const W = 297, H = 210, M = 10;
  const azul = [26, 107, 189];

  // Cabecera
  doc.setFillColor(...azul);
  doc.rect(0, 0, W, 18, "F");
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DentalRaúl — Periodontograma", M, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Paciente: ${pacienteNombre}`, W/2, 8, { align: "center" });
  doc.text(`Fecha: ${fecha}  ${notas ? `· ${notas}` : ""}`, W/2, 14, { align: "center" });

  // Tabla simplificada arcada superior
  let y = 24;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...azul);
  doc.text("ARCADA SUPERIOR", M, y);
  y += 4;

  renderArcadaPDF(doc, DIENTES_SUP, y, M, W);
  y += 60;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...azul);
  doc.text("ARCADA INFERIOR", M, y);
  y += 4;
  renderArcadaPDF(doc, DIENTES_INF, y, M, W);

  // Gráfica como imagen
  const canvas = document.getElementById("perio-canvas");
  if (canvas) {
    try {
      const imgData = canvas.toDataURL("image/png");
      doc.addPage();
      doc.setFillColor(...azul);
      doc.rect(0, 0, W, 12, "F");
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Gráfica de sondaje", M, 8);
      doc.addImage(imgData, "PNG", M, 18, W - M*2, 80);
    } catch(e) { console.warn("No se pudo añadir gráfica al PDF"); }
  }

  doc.save(`Periodontograma_${pacienteNombre.replace(/\s/g,"_")}_${fecha}.pdf`);
}

function renderArcadaPDF(doc, dientes, startY, M, W) {
  const colW = (W - M*2 - 30) / dientes.length;
  const filas = [
    { label: "Diente",    fn: n => n },
    { label: "Sondaje V", fn: n => datosPeriodo[n]?.vestibular?.sondaje?.join(" ") || "0 0 0" },
    { label: "Margen V",  fn: n => datosPeriodo[n]?.vestibular?.margen_gingival?.join(" ") || "0 0 0" },
    { label: "Recesión V",fn: n => datosPeriodo[n]?.vestibular?.recesion?.join(" ") || "0 0 0" },
    { label: "Sondaje L", fn: n => datosPeriodo[n]?.lingual?.sondaje?.join(" ") || "0 0 0" },
    { label: "Margen L",  fn: n => datosPeriodo[n]?.lingual?.margen_gingival?.join(" ") || "0 0 0" },
    { label: "Recesión L",fn: n => datosPeriodo[n]?.lingual?.recesion?.join(" ") || "0 0 0" },
    { label: "Movilidad", fn: n => datosPeriodo[n]?.movilidad || 0 },
    { label: "Placa",     fn: n => datosPeriodo[n]?.placa || 0 },
  ];

  let y = startY;
  filas.forEach((fila, fi) => {
    const bg = fi % 2 === 0 ? [248,250,252] : [255,255,255];
    doc.setFillColor(...bg);
    doc.rect(M, y, W - M*2, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(80,80,80);
    doc.text(fila.label, M + 1, y + 4);

    dientes.forEach((num, i) => {
      const val   = String(fila.fn(num));
      const x     = M + 30 + i * colW + colW/2;
      const d     = datosPeriodo[num];
      const color = fi === 0 && d.ausente ? [200,0,0] : fi === 0 && d.implante ? [0,100,200] : [30,30,30];
      doc.setFont("helvetica", fi === 0 ? "bold" : "normal");
      doc.setTextColor(...color);
      doc.text(val, x, y + 4, { align: "center" });
    });

    doc.setDrawColor(220,230,240);
    doc.line(M, y + 6, W - M, y + 6);
    y += 6;
  });
}