const supabase = require("../config/supabaseClient");

async function getAll() {
  const { data, error } = await supabase
    .from("catalogo_tratamientos").select("*")
    .order("categoria").order("nombre");
  if (error) throw new Error(error.message);
  return data;
}

async function getActivos() {
  const { data, error } = await supabase
    .from("catalogo_tratamientos").select("*")
    .eq("activo", true).order("categoria").order("nombre");
  if (error) throw new Error(error.message);
  return data;
}

async function create(campos) {
  const { data, error } = await supabase
    .from("catalogo_tratamientos").insert([campos]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function update(id, campos) {
  const { data, error } = await supabase
    .from("catalogo_tratamientos").update(campos).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function remove(id) {
  const { error } = await supabase
    .from("catalogo_tratamientos").update({ activo: false }).eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getAll, getActivos, create, update, remove };