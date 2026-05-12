const usuariosService = require("../services/usuariosService");
const authService     = require("../services/authService");

async function getAll(req, res) {
  try { res.json(await usuariosService.getAll()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function getById(req, res) {
  try { res.json(await usuariosService.getById(req.params.id)); }
  catch (err) { res.status(404).json({ error: err.message }); }
}

async function getDoctores(req, res) {
  try { res.json(await usuariosService.getDoctores()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

// Solo admin puede crear usuarios
async function create(req, res) {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ error: "Sin permisos para crear usuarios" });
  }
  try {
    const { email, password, nombre, apellidos, rol, especialidad, telefono } = req.body;
    const data = await authService.registro(email, password, nombre, apellidos, rol);
    // Actualizar campos extra si los hay
    if (especialidad || telefono) {
      await usuariosService.update(data.user.id, { especialidad, telefono });
    }
    res.status(201).json({ mensaje: "Usuario creado", data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function update(req, res) {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ error: "Sin permisos" });
  }
  try { res.json(await usuariosService.update(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function desactivar(req, res) {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ error: "Sin permisos" });
  }
  try { res.json(await usuariosService.desactivar(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function activar(req, res) {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ error: "Sin permisos" });
  }
  try { res.json(await usuariosService.activar(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getAll, getById, getDoctores, create, update, desactivar, activar };