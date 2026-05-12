const supabase = require("../config/supabaseClient");

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Email o contraseña incorrectos");
  return data;
}

async function registro(email, password, nombre) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { nombre } }
  });
  if (error) throw new Error(error.message);
  return data;
}

async function getUsuario(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw new Error("Token inválido");
  return data.user;
}

module.exports = { login, registro, getUsuario };