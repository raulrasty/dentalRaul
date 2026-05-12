const pagosService = require("../services/pagosService");

async function getAll(req, res) {
  try {
    const data = await pagosService.getAll();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getPendientes(req, res) {
  try {
    const data = await pagosService.getPendientes();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getByPaciente(req, res) {
  try {
    const data = await pagosService.getByPaciente(req.params.paciente_id);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function create(req, res) {
  try {
    const data = await pagosService.create(req.body);
    res.status(201).json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function update(req, res) {
  try {
    const data = await pagosService.update(req.params.id, req.body);
    res.json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try {
    await pagosService.remove(req.params.id);
    res.json({ mensaje: "Pago eliminado" });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getAll, getPendientes, getByPaciente, create, update, remove };