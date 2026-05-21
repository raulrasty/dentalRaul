const supabase = require("../config/supabaseClient");

async function getByPaciente(paciente_id) {
  const { data, error } = await supabase
    .from("periodontogramas")
    .select("*, usuarios(nombre, apellidos)")
    .eq("paciente_id", paciente_id)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from("periodontogramas")
    .select("*, usuarios(nombre, apellidos), pacientes(nombre, apellidos)")
    .eq("id", id).single();
  if (error) throw new Error("Periodontograma no encontrado");
  return data;
}

async function create(campos) {
  const { data, error } = await supabase
    .from("periodontogramas").insert([campos]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function update(id, campos) {
  const { data, error } = await supabase
    .from("periodontogramas").update(campos).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function remove(id) {
  const { error } = await supabase.from("periodontogramas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getByPaciente, getById, create, update, remove };