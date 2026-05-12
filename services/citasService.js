const supabase = require("../config/supabaseClient");

async function getAll() {
  const { data, error } = await supabase
    .from("citas")
    .select("*, pacientes(nombre, apellidos, telefono)")
    .order("fecha").order("hora");
  if (error) throw new Error(error.message);
  return data;
}

async function getHoy() {
  const hoy = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("citas")
    .select("*, pacientes(nombre, apellidos, telefono)")
    .eq("fecha", hoy)
    .order("hora");
  if (error) throw new Error(error.message);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from("citas").select("*, pacientes(nombre, apellidos)")
    .eq("id", id).single();
  if (error) throw new Error("Cita no encontrada");
  return data;
}

async function create(cita) {
  const { data, error } = await supabase
    .from("citas").insert([{ ...cita, estado: "pendiente" }]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function update(id, campos) {
  const { data, error } = await supabase
    .from("citas").update(campos).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function remove(id) {
  const { error } = await supabase.from("citas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getAll, getHoy, getById, create, update, remove };