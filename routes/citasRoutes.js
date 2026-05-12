const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/citasController");
const requireAuth = require("../middleware/requireAuth");

router.get("/",       requireAuth, ctrl.getAll);
router.get("/hoy",    requireAuth, ctrl.getHoy);
router.get("/:id",    requireAuth, ctrl.getById);
router.post("/",      requireAuth, ctrl.create);
router.put("/:id",    requireAuth, ctrl.update);
router.delete("/:id", requireAuth, ctrl.remove);

module.exports = router;