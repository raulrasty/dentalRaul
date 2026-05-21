const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/antecedentesController");
const requireAuth = require("../middleware/requireAuth");

router.get("/:paciente_id",  requireAuth, ctrl.getByPaciente);
router.post("/:paciente_id", requireAuth, ctrl.upsert);

module.exports = router;