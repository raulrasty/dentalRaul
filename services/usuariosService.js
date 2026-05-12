const supabase = require("../config/supabaseClient");

async function getAll() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, apellidos, email, especialidad, telefono, rol, activo, created_at")
    .order("apellidos");
  if (error) throw new Error(error.message);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from("usuarios").select("*").eq("id", id).single();
  if (error) throw new Error("Usuario no encontrado");
  return data;
}

async function getDoctores() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, apellidos, especialidad")
    .eq("rol", "doctor")
    .eq("activo", true)
    .order("apellidos");
  if (error) throw new Error(error.message);
  return data;
}

async function update(id, campos) {
  const { data, error } = await supabase
    .from("usuarios").update(campos).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function desactivar(id) {
  const { data, error } = await supabase
    .from("usuarios").update({ activo: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function activar(id) {
  const { data, error } = await supabase
    .from("usuarios").update({ activo: true }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

module.exports = { getAll, getById, getDoctores, update, desactivar, activar };