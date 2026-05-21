const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/catalogoController");
const requireAuth = require("../middleware/requireAuth");

router.get("/",          requireAuth, ctrl.getAll);
router.get("/activos",   requireAuth, ctrl.getActivos);
router.post("/",         requireAuth, ctrl.create);
router.put("/:id",       requireAuth, ctrl.update);
router.delete("/:id",    requireAuth, ctrl.remove);

module.exports = router;