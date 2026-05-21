const svc = require("../services/catalogoService");

async function getAll(req, res) {
  try { res.json(await svc.getAll()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function getActivos(req, res) {
  try { res.json(await svc.getActivos()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function create(req, res) {
  try { res.status(201).json(await svc.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function update(req, res) {
  try { res.json(await svc.update(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try { await svc.remove(req.params.id); res.json({ mensaje: "Eliminado" }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getAll, getActivos, create, update, remove };