const bloqueosService = require("../services/bloqueosService");

async function getBloqueos(req, res) {
  try {
    const { desde, hasta, fecha, doctor_id } = req.query;
    const data = desde && hasta
      ? await bloqueosService.getByRango(desde, hasta, doctor_id)
      : await bloqueosService.getByFecha(fecha, doctor_id);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function create(req, res) {
  try {
    const data = await bloqueosService.create(req.body);
    res.status(201).json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try {
    await bloqueosService.remove(req.params.id);
    res.json({ mensaje: "Bloqueo eliminado" });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getBloqueos, create, remove };