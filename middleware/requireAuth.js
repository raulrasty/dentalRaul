const supabase = require("../config/supabaseClient");

async function requireAuth(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No autorizado" });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return res.status(401).json({ error: "Token inválido o expirado" });

  req.user = data.user;
  next();
}

module.exports = requireAuth;