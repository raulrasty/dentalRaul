const supabase = require("../config/supabaseClient");

async function login(email, password) {
  // 1. Autenticar con Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Email o contraseña incorrectos");

  // 2. Comprobar que existe en tabla usuarios y está activo
  const { data: usuario, error: userError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (userError || !usuario) throw new Error("Usuario no registrado en el sistema");
  if (!usuario.activo) throw new Error("Tu cuenta está desactivada. Contacta con el administrador");

  return { session: data.session, usuario };
}

async function registro(email, password, nombre, apellidos, rol = "recepcionista") {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);

  // Insertar en tabla usuarios
  const { error: insertError } = await supabase.from("usuarios").insert([{
    id: data.user.id,
    nombre,
    apellidos,
    email,
    rol
  }]);

  if (insertError) throw new Error(insertError.message);
  return data;
}

async function getUsuario(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw new Error("Token inválido");

  // Traer datos completos incluyendo rol
  const { data: usuario, error: userError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (userError || !usuario) throw new Error("Usuario no encontrado");
  return usuario;
}

module.exports = { login, registro, getUsuario };