const supabase = require("../config/supabaseClient");

async function getAll() {
  const { data, error } = await supabase.from("pacientes").select("*").order("apellidos");
  if (error) throw new Error(error.message);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*, citas(*), historiales(*), pagos(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error("Paciente no encontrado");
  return data;
}

async function create(paciente) {
  const { data, error } = await supabase.from("pacientes").insert([paciente]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function update(id, campos) {
  const { data, error } = await supabase.from("pacientes").update(campos).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function remove(id) {
  const { error } = await supabase.from("pacientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getAll, getById, create, update, remove };