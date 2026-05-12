const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/historialesController");
const requireAuth = require("../middleware/requireAuth");

router.get("/paciente/:paciente_id", requireAuth, ctrl.getByPaciente);
router.post("/",                     requireAuth, ctrl.create);
router.put("/:id",                   requireAuth, ctrl.update);
router.delete("/:id",                requireAuth, ctrl.remove);

module.exports = router;