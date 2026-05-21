const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/periodontogramaController");
const requireAuth = require("../middleware/requireAuth");

router.get("/paciente/:paciente_id", requireAuth, ctrl.getByPaciente);
router.get("/:id",                   requireAuth, ctrl.getById);
router.post("/",                     requireAuth, ctrl.create);
router.put("/:id",                   requireAuth, ctrl.update);
router.delete("/:id",                requireAuth, ctrl.remove);

module.exports = router;