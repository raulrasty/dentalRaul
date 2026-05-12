const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pagosController");
const requireAuth = require("../middleware/requireAuth");

router.get("/",                      requireAuth, ctrl.getAll);
router.get("/pendientes",            requireAuth, ctrl.getPendientes);
router.get("/paciente/:paciente_id", requireAuth, ctrl.getByPaciente);
router.post("/",                     requireAuth, ctrl.create);
router.put("/:id",                   requireAuth, ctrl.update);
router.delete("/:id",                requireAuth, ctrl.remove);

module.exports = router;