const supabase = require("../config/supabaseClient");

async function getAll() {
  const { data, error } = await supabase
    .from("pagos").select("*, pacientes(nombre, apellidos)")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function getPendientes() {
  const { data, error } = await supabase
    .from("pagos").select("*, pacientes(nombre, apellidos)")
    .eq("estado", "pendiente").order("fecha");
  if (error) throw new Error(error.message);
  return data;
}

async function getByPaciente(paciente_id) {
  const { data, error } = await supabase
    .from("pagos").select("*").eq("paciente_id", paciente_id)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function create(pago) {
  const fecha = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("pagos").insert([{ ...pago, estado: pago.estado || "pendiente", fecha }]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function update(id, campos) {
  const { data, error } = await supabase
    .from("pagos").update(campos).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function remove(id) {
  const { error } = await supabase.from("pagos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getAll, getPendientes, getByPaciente, create, update, remove };