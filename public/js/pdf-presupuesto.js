/* =============================================
   DENTALRAÚL — pdf-presupuesto.js
   Genera PDF del presupuesto con jsPDF
   ============================================= */

async function exportarPresupuestoPDF(presupuestoId) {
  // Cargar datos del presupuesto
  const res  = await fetch(`${CONFIG.API_URL}/presupuestos/${presupuestoId}`, { credentials: "include" });
  const pres = await res.json();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W  = 210; // ancho A4
  const M  = 15;  // margen
  let   y  = 20;  // posición Y actual

  // ---- COLORES ----
  const azul     = [26, 107, 189];
  const azulOsc  = [15, 74, 138];
  const gris     = [100, 100, 100];
  const grisClar = [240, 244, 248];
  const negro    = [30, 30, 30];

  // ---- CABECERA ----
  doc.setFillColor(...azul);
  doc.rect(0, 0, W, 40, "F");

  // Logo texto
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DentalRaúl", M, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 225, 255);
  doc.text("Clínica Dental · Sistema de Gestión", M, 25);
  doc.text("clinica@dentalraul.com", M, 30);

  // Título presupuesto (derecha)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("PRESUPUESTO", W - M, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 225, 255);
  doc.text(`Fecha: ${formatFechaPDF(pres.fecha)}`, W - M, 25, { align: "right" });

  const badgeEstado = { borrador:"Borrador", enviado:"Enviado", aceptado:"Aceptado", rechazado:"Rechazado" };
  doc.text(`Estado: ${badgeEstado[pres.estado] || pres.estado}`, W - M, 30, { align: "right" });

  y = 50;

  // ---- DATOS PACIENTE ----
  doc.setFillColor(...grisClar);
  doc.rect(M, y, W - M * 2, 28, "F");
  doc.setDrawColor(220, 230, 240);
  doc.rect(M, y, W - M * 2, 28, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...azulOsc);
  doc.text("DATOS DEL PACIENTE", M + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...negro);
  const paciente = pres.pacientes;
  doc.text(`${paciente?.nombre || ""} ${paciente?.apellidos || ""}`, M + 5, y + 14);

  doc.setFontSize(9);
  doc.setTextColor(...gris);
  const creador = pres.usuarios ? `Elaborado por: ${pres.usuarios.nombre} ${pres.usuarios.apellidos}` : "";
  doc.text(creador, M + 5, y + 21);
  if (pres.notas) doc.text(`Notas: ${pres.notas}`, M + 5, y + 26);

  y += 36;

  // ---- TABLA TRATAMIENTOS ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...negro);
  doc.text("Tratamientos incluidos", M, y);
  y += 6;

  // Cabecera tabla
  const colDiente = M;
  const colNombre = M + 30;
  const colCuad   = M + 100;
  const colPrecio = W - M;

  doc.setFillColor(...azul);
  doc.rect(M, y, W - M * 2, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DIENTE(S)", colDiente + 2, y + 5.5);
  doc.text("TRATAMIENTO", colNombre + 2, y + 5.5);
  doc.text("CUADRANTE", colCuad + 2, y + 5.5);
  doc.text("PRECIO", colPrecio, y + 5.5, { align: "right" });
  y += 8;

  // Filas — individual: una fila por diente / global: una fila con todos
  const lineas = pres.presupuesto_lineas || [];
  const filasExpandidas = [];
  lineas.forEach(l => {
    const da      = l.dientes_afectados;
    const dientes = da ? (Array.isArray(da) ? da : Object.values(da)) : [];
    const esGlobal = l.modo === "global";

    if (!esGlobal && dientes.length > 1) {
      // Individual — una fila por diente
      dientes.forEach(d => filasExpandidas.push({ ...l, _diente: d, _dientesAll: null }));
    } else {
      // Global o un solo diente — una fila
      filasExpandidas.push({ ...l, _diente: dientes.length === 1 ? dientes[0] : null, _dientesAll: dientes.length > 1 ? dientes : null });
    }
  });

  filasExpandidas.forEach((l, i) => {
    const bg = i % 2 === 0 ? [255,255,255] : grisClar;
    doc.setFillColor(...bg);
    doc.rect(M, y, W - M * 2, 9, "F");
    doc.setDrawColor(220, 230, 240);
    doc.line(M, y + 9, W - M, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...negro);

    // Diente(s)
    let dienteStr;
    if (l._dientesAll && l._dientesAll.length) {
      dienteStr = l._dientesAll.join(", ");
    } else {
      dienteStr = l._diente ? String(l._diente) : (l.cuadrante || "—");
    }
    const dienteStrCorto = dienteStr.length > 20 ? dienteStr.substring(0, 18) + "…" : dienteStr;
    doc.text(dienteStrCorto, colDiente + 2, y + 6);

    // Nombre
    const nombre = l.nombre.length > 38 ? l.nombre.substring(0, 36) + "..." : l.nombre;
    doc.text(nombre, colNombre + 2, y + 6);

    // Cuadrante
    doc.setTextColor(...gris);
    doc.text(l._diente ? "—" : (l.cuadrante || "—"), colCuad + 2, y + 6);

    // Precio
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...azulOsc);
    doc.text(`${parseFloat(l.precio).toFixed(2)} €`, colPrecio, y + 6, { align: "right" });

    y += 9;
    if (y > 260) { doc.addPage(); y = 20; }
  });

  y += 4;

  // ---- TOTAL ----
  doc.setFillColor(...azul);
  doc.rect(W - M - 60, y, 60, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL:", W - M - 58, y + 8);
  doc.setFontSize(12);
  // Total ya viene calculado correctamente desde el backend
  doc.text(`${parseFloat(pres.total || 0).toFixed(2)} €`, W - M - 2, y + 8, { align: "right" });

  y += 20;

  // ---- CONDICIONES ----
  doc.setDrawColor(...azul);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...azulOsc);
  doc.text("CONDICIONES DEL PRESUPUESTO", M, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...gris);
  const condiciones = [
    "• Este presupuesto tiene una validez de 30 días desde la fecha de emisión.",
    "• Los precios indicados pueden variar en función de la evolución del tratamiento.",
    "• El presupuesto no incluye tratamientos adicionales que puedan surgir durante el proceso.",
    "• Para confirmar el tratamiento, es necesaria la firma del presente documento."
  ];
  condiciones.forEach(c => {
    doc.text(c, M, y);
    y += 4.5;
  });

  y += 8;

  // ---- FIRMA ----
  if (y < 240) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...gris);

    // Firma paciente
    doc.text("Firma del paciente:", M, y);
    doc.line(M, y + 12, M + 70, y + 12);
    doc.text("Fecha: ________________", M, y + 18);

    // Firma clínica
    doc.text("Firma y sello de la clínica:", W - M - 70, y);
    doc.line(W - M - 70, y + 12, W - M, y + 12);
    doc.text("Fecha: ________________", W - M - 70, y + 18);
  }

  // ---- PIE ----
  doc.setFillColor(...azulOsc);
  doc.rect(0, 287, W, 10, "F");
  doc.setTextColor(200, 225, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("DentalRaúl · Sistema de Gestión Clínica", W / 2, 293, { align: "center" });

  // ---- GUARDAR ----
  const nombreArchivo = `Presupuesto_${paciente?.apellidos || "Paciente"}_${formatFechaPDF(pres.fecha)}.pdf`;
  doc.save(nombreArchivo);
}

function formatFechaPDF(fecha) {
  if (!fecha) return new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
  return new Date(fecha).toLocaleDateString("es-ES").replace(/\//g, "-");
}