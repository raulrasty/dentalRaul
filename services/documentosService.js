const supabase = require("../config/supabaseClient");

async function getByPaciente(paciente_id) {
  const { data, error } = await supabase
    .from("documentos").select("*, usuarios(nombre, apellidos)")
    .eq("paciente_id", paciente_id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function create(doc) {
  const { data, error } = await supabase
    .from("documentos").insert([doc]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function getSignedUrl(path) {
  const { data, error } = await supabase.storage
    .from("documentos-paciente")
    .createSignedUrl(path, 3600); // 1 hora
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

async function remove(id) {
  // Obtener path antes de eliminar
  const { data: doc } = await supabase
    .from("documentos").select("storage_path").eq("id", id).single();

  if (doc?.storage_path) {
    await supabase.storage.from("documentos-paciente").remove([doc.storage_path]);
  }

  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

module.exports = { getByPaciente, create, getSignedUrl, remove };