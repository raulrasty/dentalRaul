const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/usuariosController");
const requireAuth = require("../middleware/requireAuth");

router.get("/",              requireAuth, ctrl.getAll);
router.get("/doctores",      requireAuth, ctrl.getDoctores);
router.get("/:id",           requireAuth, ctrl.getById);
router.post("/",             requireAuth, ctrl.create);
router.put("/:id",           requireAuth, ctrl.update);
router.patch("/:id/desactivar", requireAuth, ctrl.desactivar);
router.patch("/:id/activar",    requireAuth, ctrl.activar);

module.exports = router;