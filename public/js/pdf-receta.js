/* =============================================
   DENTALRAÚL — pdf-receta.js
   Genera receta médica en PDF con jsPDF
   ============================================= */

function generarRecetaPDF(datos) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  const W = 148, M = 12;
  const azul    = [26, 107, 189];
  const azulOsc = [15, 74, 138];
  const gris    = [100, 100, 100];
  const negro   = [30, 30, 30];

  // Cabecera
  doc.setFillColor(...azul);
  doc.rect(0, 0, W, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DentalRaúl", M, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 225, 255);
  doc.text("Clínica Dental · Sistema de Gestión", M, 17);
  doc.text("clinica@dentalraul.com", M, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("RECETA MÉDICA", W - M, 17, { align: "right" });

  let y = 36;

  // Datos paciente
  doc.setFillColor(240, 244, 248);
  doc.rect(M, y, W - M * 2, 18, "F");
  doc.setDrawColor(220, 230, 240);
  doc.rect(M, y, W - M * 2, 18, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...azulOsc);
  doc.text("PACIENTE", M + 3, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...negro);
  doc.text(datos.paciente || "—", M + 3, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...gris);
  doc.text(`Fecha: ${datos.fecha || new Date().toLocaleDateString("es-ES")}`, W - M - 3, y + 13, { align: "right" });

  y += 26;

  // Línea Rp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...azul);
  doc.text("Rp/", M, y);
  y += 8;

  // Medicamentos
  const medicamentos = datos.medicamentos || [];
  medicamentos.forEach((med, i) => {
    if (y > 175) return;

    const bg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
    doc.setFillColor(...bg);
    doc.rect(M, y - 4, W - M * 2, 22, "F");

    // Número
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...azul);
    doc.text(`${i + 1}.`, M + 2, y + 2);

    // Nombre medicamento
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...negro);
    doc.text(med.nombre || "—", M + 9, y + 2);

    // Dosis
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...gris);
    doc.text(`Dosis: ${med.dosis || "—"}`, M + 9, y + 8);
    doc.text(`Pauta: ${med.pauta || "—"}`, M + 9, y + 14);

    if (med.duracion) {
      doc.text(`Duración: ${med.duracion}`, W - M - 3, y + 8, { align: "right" });
    }

    doc.setDrawColor(220, 230, 240);
    doc.line(M, y + 18, W - M, y + 18);
    y += 26;
  });

  y += 4;

  // Observaciones
  if (datos.observaciones) {
    doc.setFillColor(255, 251, 235);
    doc.rect(M, y, W - M * 2, 16, "F");
    doc.setDrawColor(253, 230, 138);
    doc.rect(M, y, W - M * 2, 16, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(146, 100, 10);
    doc.text("OBSERVACIONES", M + 3, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...negro);
    const lines = doc.splitTextToSize(datos.observaciones, W - M * 2 - 6);
    doc.text(lines[0] || "", M + 3, y + 12);
    y += 22;
  }

  y += 4;

  // Firma
  if (y < 175) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...gris);

    doc.text("Firma y sello del médico:", M, y);
    doc.line(M, y + 14, M + 55, y + 14);

    doc.text(`${datos.doctor || "Dr./Dra."}`, W - M - 3, y + 5, { align: "right" });
    doc.text(`Nº Colegiado: ${datos.colegiado || "___________"}`, W - M - 3, y + 11, { align: "right" });
  }

  // Pie
  doc.setFillColor(...azulOsc);
  doc.rect(0, 202, W, 8, "F");
  doc.setTextColor(200, 225, 255);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("DentalRaúl · Clínica Dental", W / 2, 207, { align: "center" });

  doc.save(`Receta_${(datos.paciente || "Paciente").replace(/\s/g, "_")}_${datos.fecha || "hoy"}.pdf`);
}