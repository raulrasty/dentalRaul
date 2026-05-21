const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/documentosController");
const requireAuth = require("../middleware/requireAuth");
const multer   = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf","image/jpeg","image/png","image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten PDF e imágenes"));
  }
});

router.get("/paciente/:paciente_id",  requireAuth, ctrl.getByPaciente);
router.post("/upload",                requireAuth, upload.single("archivo"), ctrl.upload);
router.get("/url",                    requireAuth, ctrl.getUrl);
router.delete("/:id",                 requireAuth, ctrl.remove);

module.exports = router;