const supabase = require("../config/supabaseClient");

async function getByPaciente(paciente_id) {
  const { data, error } = await supabase
    .from("antecedentes").select("*").eq("paciente_id", paciente_id).single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data || null;
}

async function upsert(paciente_id, campos) {
  const { data, error } = await supabase
    .from("antecedentes")
    .upsert({ paciente_id, ...campos, updated_at: new Date().toISOString() }, { onConflict: "paciente_id" })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

module.exports = { getByPaciente, upsert };