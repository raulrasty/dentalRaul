const pacientesService = require("../services/pacientesService");

async function getAll(req, res) {
  try {
    const data = await pacientesService.getAll();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getById(req, res) {
  try {
    const data = await pacientesService.getById(req.params.id);
    res.json(data);
  } catch (err) { res.status(404).json({ error: err.message }); }
}

async function create(req, res) {
  try {
    const data = await pacientesService.create(req.body);
    res.status(201).json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function update(req, res) {
  try {
    const data = await pacientesService.update(req.params.id, req.body);
    res.json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try {
    await pacientesService.remove(req.params.id);
    res.json({ mensaje: "Paciente eliminado" });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getAll, getById, create, update, remove };