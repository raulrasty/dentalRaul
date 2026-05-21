const supabase = require("../config/supabaseClient");

async function getByPaciente(paciente_id) {
  const { data, error } = await supabase
    .from("historiales").select("*")
    .eq("paciente_id", paciente_id).order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from("historiales").select("*").eq("id", id).single();
  if (error) throw new Error("Registro no encontrado");
  return data;
}

async function create(historial) {
  const fecha = historial.fecha || new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("historiales").insert([{ ...historial, fecha }]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function update(id, campos) {
  // Limpiar undefined
  const camposLimpios = Object.fromEntries(
    Object.entries(campos).filter(([_, v]) => v !== undefined)
  );
  const { data, error } = await supabase
    .from("historiales").update(camposLimpios).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function remove(id) {
  const { error } = await supabase.from("historiales").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getByPaciente, getById, create, update, remove };