const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/presupuestosController");
const requireAuth = require("../middleware/requireAuth");

router.get("/",                        requireAuth, ctrl.getAll);
router.get("/paciente/:paciente_id",   requireAuth, ctrl.getByPaciente);
router.get("/:id",                     requireAuth, ctrl.getById);
router.post("/",                       requireAuth, ctrl.create);
router.patch("/:id/estado",            requireAuth, ctrl.updateEstado);
router.patch("/:id/aceptar",           requireAuth, ctrl.aceptar);
router.delete("/:id",                  requireAuth, ctrl.remove);

module.exports = router;