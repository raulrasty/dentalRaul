const svc = require("../services/presupuestosService");

async function getAll(req, res) {
  try { res.json(await svc.getAll()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function getByPaciente(req, res) {
  try { res.json(await svc.getByPaciente(req.params.paciente_id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function getById(req, res) {
  try { res.json(await svc.getById(req.params.id)); }
  catch (err) { res.status(404).json({ error: err.message }); }
}

async function create(req, res) {
  try {
    const { lineas, ...presupuesto } = req.body;
    presupuesto.creado_por = req.usuario.id;
    res.status(201).json(await svc.create(presupuesto, lineas));
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function updateEstado(req, res) {
  try { res.json(await svc.updateEstado(req.params.id, req.body.estado)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function aceptar(req, res) {
  try { res.json(await svc.aceptar(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try { await svc.remove(req.params.id); res.json({ mensaje: "Eliminado" }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getAll, getByPaciente, getById, create, updateEstado, aceptar, remove };