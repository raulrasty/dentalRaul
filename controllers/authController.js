const authService = require("../services/authService");

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { session, usuario } = await authService.login(email, password);
    res.cookie("token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ mensaje: "Login exitoso", usuario });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

async function registro(req, res) {
  try {
    const { email, password, nombre, apellidos, rol } = req.body;
    const data = await authService.registro(email, password, nombre, apellidos, rol);
    res.json({ mensaje: "Usuario creado correctamente", data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function logout(req, res) {
  res.clearCookie("token");
  res.json({ mensaje: "Sesión cerrada" });
}

async function me(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "No autenticado" });
    const usuario = await authService.getUsuario(token);
    res.json({ usuario });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

async function cambiarPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
    const supabase = require("../config/supabaseClient");
    const { error } = await supabase.auth.admin.updateUserById(req.usuario.id, { password });
    if (error) throw new Error(error.message);
    res.json({ mensaje: "Contraseña cambiada correctamente" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { login, registro, logout, me, cambiarPassword };