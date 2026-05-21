const supabase = require("../config/supabaseClient");

async function getAll() {
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*, pacientes(nombre, apellidos), usuarios(nombre, apellidos)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function getByPaciente(paciente_id) {
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*, usuarios(nombre, apellidos), presupuesto_lineas(*)")
    .eq("paciente_id", paciente_id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*, pacientes(nombre, apellidos), usuarios(nombre, apellidos), presupuesto_lineas(*, catalogo_tratamientos(nombre, categoria))")
    .eq("id", id).single();
  if (error) throw new Error("Presupuesto no encontrado");
  return data;
}

async function create(presupuesto, lineas) {
  const { data: pres, error } = await supabase
    .from("presupuestos").insert([presupuesto]).select().single();
  if (error) throw new Error(error.message);

  if (lineas && lineas.length > 0) {
    const lineasConId = lineas.map(l => ({ ...l, presupuesto_id: pres.id }));
    const { error: eLineas } = await supabase.from("presupuesto_lineas").insert(lineasConId);
    if (eLineas) throw new Error(eLineas.message);
  }

  // Calcular total respetando modo global/individual
  const total = lineas.reduce((s, l) => {
    const da         = l.dientes_afectados;
    const esGlobal   = l.modo === "global";
    const numDientes = (!esGlobal && da && Array.isArray(da) && da.length > 1) ? da.length : 1;
    return s + parseFloat(l.precio || 0) * numDientes;
  }, 0);

  await supabase.from("presupuestos").update({ total }).eq("id", pres.id);
  return { ...pres, total };
}

async function updateEstado(id, estado) {
  const { data, error } = await supabase
    .from("presupuestos").update({ estado }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function aceptar(id) {
  await updateEstado(id, "aceptado");

  const { data: lineas, error } = await supabase
    .from("presupuesto_lineas").select("*").eq("presupuesto_id", id);
  if (error) throw new Error(error.message);

  const { data: pres } = await supabase
    .from("presupuestos").select("paciente_id").eq("id", id).single();

  const hoy       = new Date().toISOString().split("T")[0];
  const historiales = [];

  for (const l of lineas) {
    const da      = l.dientes_afectados;
    const dientes = da ? (Array.isArray(da) ? da : Object.values(da)) : [];
    const esGlobal = l.modo === "global";

    if (!esGlobal && dientes.length > 1) {
      // Individual — un tratamiento por diente, mismo precio cada uno
      for (const diente of dientes) {
        historiales.push({
          paciente_id:          pres.paciente_id,
          presupuesto_linea_id: l.id,
          tratamiento:          l.nombre,
          dientes_afectados:    [diente],
          cuadrante:            l.cuadrante,
          presupuesto:          l.precio,
          estado_tratamiento:   "pendiente",
          fecha:                hoy
        });
      }
    } else {
      // Global o un solo diente — un único tratamiento con todos los dientes
      historiales.push({
        paciente_id:          pres.paciente_id,
        presupuesto_linea_id: l.id,
        tratamiento:          l.nombre,
        dientes_afectados:    dientes.length ? dientes : null,
        cuadrante:            l.cuadrante,
        presupuesto:          l.precio,
        estado_tratamiento:   "pendiente",
        fecha:                hoy
      });
    }
  }

  const { error: eH } = await supabase.from("historiales").insert(historiales);
  if (eH) throw new Error(eH.message);

  return { mensaje: "Presupuesto aceptado y tratamientos creados" };
}

async function remove(id) {
  const { error } = await supabase.from("presupuestos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getAll, getByPaciente, getById, create, updateEstado, aceptar, remove };