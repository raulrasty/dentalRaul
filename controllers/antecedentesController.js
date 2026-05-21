const svc = require("../services/antecedentesService");

async function getByPaciente(req, res) {
  try {
    const data = await svc.getByPaciente(req.params.paciente_id);
    res.json(data || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function upsert(req, res) {
  try {
    const data = await svc.upsert(req.params.paciente_id, req.body);
    res.json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getByPaciente, upsert };