const svc      = require("../services/documentosService");
const supabase  = require("../config/supabaseClient");

async function getByPaciente(req, res) {
  try { res.json(await svc.getByPaciente(req.params.paciente_id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
}

async function upload(req, res) {
  try {
    const { paciente_id, nombre, tipo } = req.body;
    const file = req.file;
    if (!file) throw new Error("No se recibió ningún archivo");

    const ext  = file.originalname.split(".").pop();
    const path = `${paciente_id}/${Date.now()}_${nombre.replace(/\s/g,"_")}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos-paciente")
      .upload(path, file.buffer, { contentType: file.mimetype });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = await supabase.storage
      .from("documentos-paciente")
      .createSignedUrl(path, 3600);

    const doc = await svc.create({
      paciente_id,
      nombre,
      tipo:         tipo || "otro",
      url:          urlData.signedUrl,
      storage_path: path,
      subido_por:   req.usuario.id
    });

    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

// Recibe el path como query: /api/documentos/url?path=...
async function getUrl(req, res) {
  try {
    const storagePath = req.query.path;
    if (!storagePath) throw new Error("Path no proporcionado");
    const url = await svc.getSignedUrl(storagePath);
    res.json({ url });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function remove(req, res) {
  try { await svc.remove(req.params.id); res.json({ mensaje: "Eliminado" }); }
  catch (err) { res.status(400).json({ error: err.message }); }
}

module.exports = { getByPaciente, upload, getUrl, remove };