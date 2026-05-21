/* =============================================
   DENTALRAÚL — periodontograma-comparacion.js
   ============================================= */

let periodoA    = null;
let periodoB    = null;
let graficaComp = null;

async function generarComparacion() {
  const idA = document.getElementById("comp-sel-a").value;
  const idB = document.getElementById("comp-sel-b").value;

  if (idA === idB) {
    document.getElementById("comp-resultado").innerHTML =
      `<div class="alert alert-warning">Selecciona dos periodontogramas diferentes</div>`;
    return;
  }

  document.getElementById("comp-resultado").innerHTML =
    `<div class="empty-state"><div class="empty-state-icon"></div><p>Cargando...</p></div>`;

  const [resA, resB] = await Promise.all([
    fetch(`${CONFIG.API_URL}/periodontogramas/${idA}`, { credentials: "include" }),
    fetch(`${CONFIG.API_URL}/periodontogramas/${idB}`, { credentials: "include" })
  ]);

  periodoA = await resA.json();
  periodoB = await resB.json();

  if (new Date(periodoA.fecha) > new Date(periodoB.fecha)) {
    [periodoA, periodoB] = [periodoB, periodoA];
  }

  renderComparacion();
}

function renderComparacion() {
  const datosA = periodoA.datos || {};
  const datosB = periodoB.datos || {};
  const stats  = calcularStats(datosA, datosB);

  const html = `
    <div class="comp-stats">
      ${[
        ["Media sondaje", stats.mediaA.toFixed(1)+" mm", stats.mediaB.toFixed(1)+" mm", stats.mediaB < stats.mediaA],
        ["% Sangrado", stats.sangradoA.toFixed(0)+"%", stats.sangradoB.toFixed(0)+"%", stats.sangradoB < stats.sangradoA],
        ["Bolsas ≥4mm", stats.bolsasA, stats.bolsasB, stats.bolsasB < stats.bolsasA],
        ["% Placa", stats.placaA.toFixed(0)+"%", stats.placaB.toFixed(0)+"%", stats.placaB < stats.placaA]
      ].map(([titulo, valA, valB, mejora]) => `
        <div class="comp-stat-card">
          <div class="comp-stat-titulo">${titulo}</div>
          <div class="comp-stat-fila"><span class="comp-fecha-label">${formatFechaComp(periodoA.fecha)}</span><strong>${valA}</strong></div>
          <div class="comp-stat-fila"><span class="comp-fecha-label">${formatFechaComp(periodoB.fecha)}</span><strong>${valB}</strong></div>
          <div class="comp-diff ${mejora ? "mejora" : "empeora"}">${mejora ? "▼ Mejora" : "▲ Empeora"}</div>
        </div>
      `).join("")}
    </div>

    <div class="card" style="padding:1rem;margin:1rem 0;">
      <div class="card-header">
        <span class="card-title">Comparación de sondaje vestibular</span>
        <button class="btn btn-secondary btn-sm" onclick="exportarComparacionPDF()">PDF</button>
      </div>
      <canvas id="grafica-comparacion" height="120"></canvas>
    </div>

    <div class="card" style="padding:1rem;">
      <div class="card-header"><span class="card-title">Diferencias por diente</span></div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
          <thead>
            <tr>
              <th style="padding:0.5rem;text-align:left;border-bottom:2px solid var(--border);">Diente</th>
              <th style="padding:0.5rem;text-align:center;border-bottom:2px solid var(--border);">${formatFechaComp(periodoA.fecha)}</th>
              <th style="padding:0.5rem;text-align:center;border-bottom:2px solid var(--border);">${formatFechaComp(periodoB.fecha)}</th>
              <th style="padding:0.5rem;text-align:center;border-bottom:2px solid var(--border);">Diferencia</th>
              <th style="padding:0.5rem;text-align:center;border-bottom:2px solid var(--border);">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${[...DIENTES_SUP, ...DIENTES_INF].map(num => {
              const dA = datosA[num], dB = datosB[num];
              if (!dA || !dB || dA.ausente || dB.ausente) return "";
              const mA = promedioComp(dA.vestibular?.sondaje || [0,0,0]);
              const mB = promedioComp(dB.vestibular?.sondaje || [0,0,0]);
              const diff = mB - mA;
              const color = diff < -0.5 ? "#1a7a45" : diff > 0.5 ? "#9b1c1c" : "#92640a";
              const icono = diff < -0.5 ? "▼ Mejora" : diff > 0.5 ? "▲ Empeora" : "= Estable";
              const bg    = diff < -0.5 ? "#d4f5e2" : diff > 0.5 ? "#fde8e8" : "#fef3cd";
              return `<tr style="border-bottom:1px solid var(--border);">
                <td style="padding:0.4rem 0.5rem;font-weight:700;color:var(--primary);">${num}</td>
                <td style="padding:0.4rem;text-align:center;">${mA.toFixed(1)} mm</td>
                <td style="padding:0.4rem;text-align:center;">${mB.toFixed(1)} mm</td>
                <td style="padding:0.4rem;text-align:center;font-weight:700;color:${color};">${diff>0?"+":""}${diff.toFixed(1)} mm</td>
                <td style="padding:0.4rem;text-align:center;">
                  <span style="background:${bg};color:${color};padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">${icono}</span>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("comp-resultado").innerHTML = html;
  renderGraficaComparacion(datosA, datosB);
}

function renderGraficaComparacion(datosA, datosB) {
  if (graficaComp) graficaComp.destroy();
  const labels   = [...DIENTES_SUP, ...DIENTES_INF].flatMap(n => [`${n}-d`,`${n}-c`,`${n}-m`]);
  const sondajeA = [...DIENTES_SUP, ...DIENTES_INF].flatMap(n => (datosA[n]?.vestibular?.sondaje||[0,0,0]).map(v => datosA[n]?.ausente ? null : v));
  const sondajeB = [...DIENTES_SUP, ...DIENTES_INF].flatMap(n => (datosB[n]?.vestibular?.sondaje||[0,0,0]).map(v => datosB[n]?.ausente ? null : v));
  const canvas = document.getElementById("grafica-comparacion");
  if (!canvas) return;
  graficaComp = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: formatFechaComp(periodoA.fecha), data: sondajeA, borderColor: "#94a3b8", borderDash:[5,3], tension:0.3, pointRadius:2, fill:false },
        { label: formatFechaComp(periodoB.fecha), data: sondajeB, borderColor: "#1a6bbd", backgroundColor:"rgba(26,107,189,0.1)", tension:0.3, pointRadius:2, fill:true }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position:"top" } },
      scales: {
        y: { reverse:true, min:0, max:12, title:{ display:true, text:"mm" } },
        x: { ticks: { font:{ size:7 }, maxRotation:90 } }
      }
    }
  });
}

function calcularStats(datosA, datosB) {
  const dientes = [...DIENTES_SUP, ...DIENTES_INF].filter(n => datosA[n] && datosB[n] && !datosA[n].ausente && !datosB[n].ausente);
  const sA = dientes.flatMap(n => [...(datosA[n].vestibular?.sondaje||[]),...(datosA[n].lingual?.sondaje||[])]);
  const sB = dientes.flatMap(n => [...(datosB[n].vestibular?.sondaje||[]),...(datosB[n].lingual?.sondaje||[])]);
  const gA = dientes.flatMap(n => [...(datosA[n].vestibular?.sangrado||[]),...(datosA[n].lingual?.sangrado||[])]);
  const gB = dientes.flatMap(n => [...(datosB[n].vestibular?.sangrado||[]),...(datosB[n].lingual?.sangrado||[])]);
  const pA = dientes.map(n => datosA[n].placa||0);
  const pB = dientes.map(n => datosB[n].placa||0);
  return {
    mediaA:    sA.reduce((s,v)=>s+v,0)/(sA.length||1),
    mediaB:    sB.reduce((s,v)=>s+v,0)/(sB.length||1),
    sangradoA: (gA.filter(Boolean).length/(gA.length||1))*100,
    sangradoB: (gB.filter(Boolean).length/(gB.length||1))*100,
    bolsasA:   sA.filter(v=>v>=4).length,
    bolsasB:   sB.filter(v=>v>=4).length,
    placaA:    (pA.filter(v=>v>0).length/(pA.length||1))*100,
    placaB:    (pB.filter(v=>v>0).length/(pB.length||1))*100,
  };
}

function promedioComp(arr) {
  return arr.reduce((s,v)=>s+(v||0),0)/arr.length;
}

async function exportarComparacionPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
  const W = 297, M = 10, azul = [26,107,189];
  doc.setFillColor(...azul);
  doc.rect(0,0,W,16,"F");
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  doc.text("DentalRaúl — Comparación de Periodontogramas", M, 10);
  const nombrePaciente = document.getElementById("paciente-nombre")?.textContent || "";
  doc.setFontSize(8);
  doc.setFont("helvetica","normal");
  doc.text(`${nombrePaciente} · ${formatFechaComp(periodoA.fecha)} vs ${formatFechaComp(periodoB.fecha)}`, W-M, 10, { align:"right" });
  const canvas = document.getElementById("grafica-comparacion");
  if (canvas) {
    try { doc.addImage(canvas.toDataURL("image/png"),"PNG",M,22,W-M*2,70); } catch(e){}
  }
  doc.save(`Comparacion_Periodontograma_${nombrePaciente.replace(/\s/g,"_")}.pdf`);
}

function formatFechaComp(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"});
}