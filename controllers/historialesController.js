const historialesService = require("../services/historialesService");

async function getByPaciente(req, res) {
  try {
    const data = await historialesService.getByPaciente(req.params.paciente_id);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function create(req, res) {
  try {
    const data = await historialesService.create(req.body);
    res.status(201).json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function update(req, res) {
  try {
    const data = await historialesService.update(req.params.id, req.body);
    res.json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try {
    await historialesService.remove(req.params.id);
    res.json({ mensaje: "Registro eliminado" });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getByPaciente, create, update, remove };