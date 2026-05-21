const supabase = require("../config/supabaseClient");

async function getByFecha(fecha, doctorId = null) {
  let query = supabase.from("bloqueos").select("*").eq("fecha", fecha);
  if (doctorId) query = query.eq("doctor_id", doctorId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function getByRango(desde, hasta, doctorId = null) {
  let query = supabase.from("bloqueos").select("*")
    .gte("fecha", desde).lte("fecha", hasta);
  if (doctorId) query = query.eq("doctor_id", doctorId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function create(bloqueo) {
  const { data, error } = await supabase.from("bloqueos").insert([bloqueo]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function remove(id) {
  const { error } = await supabase.from("bloqueos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getByFecha, getByRango, create, remove };