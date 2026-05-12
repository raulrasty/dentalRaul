const supabase = require("../config/supabaseClient");

async function requireAuth(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Token inválido o expirado" });

  // Adjuntar datos completos incluyendo rol
  const { data: usuario } = await supabase
    .from("usuarios").select("*").eq("id", data.user.id).single();

  if (!usuario || !usuario.activo) return res.status(401).json({ error: "Cuenta desactivada" });

  req.user    = data.user;
  req.usuario = usuario; // incluye rol, nombre, etc.
  next();
}

module.exports = requireAuth;