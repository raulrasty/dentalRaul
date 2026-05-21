const svc = require("../services/periodontogramaService");

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
    const body = { ...req.body, doctor_id: req.usuario.id };
    res.status(201).json(await svc.create(body));
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function update(req, res) {
  try { res.json(await svc.update(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try { await svc.remove(req.params.id); res.json({ mensaje: "Eliminado" }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getByPaciente, getById, create, update, remove };