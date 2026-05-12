const citasService = require("../services/citasService");

async function getAll(req, res) {
  try { res.json(await citasService.getAll()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function getHoy(req, res) {
  try { res.json(await citasService.getHoy()); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function getById(req, res) {
  try { res.json(await citasService.getById(req.params.id)); }
  catch (err) { res.status(404).json({ error: err.message }); }
}

async function create(req, res) {
  try { res.status(201).json(await citasService.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function update(req, res) {
  try { res.json(await citasService.update(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try { await citasService.remove(req.params.id); res.json({ mensaje: "Cita eliminada" }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getAll, getHoy, getById, create, update, remove };