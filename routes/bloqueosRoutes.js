const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/bloqueosController");
const requireAuth = require("../middleware/requireAuth");

router.get("/",       requireAuth, ctrl.getBloqueos);
router.post("/",      requireAuth, ctrl.create);
router.delete("/:id", requireAuth, ctrl.remove);

module.exports = router;