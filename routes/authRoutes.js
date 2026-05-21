// routes/auth.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");

router.post("/login",    ctrl.login);
router.post("/registro", ctrl.registro);
router.post("/logout",   ctrl.logout);
router.get("/me",        ctrl.me);

const requireAuth = require("../middleware/requireAuth");
router.post("/cambiar-password", requireAuth, ctrl.cambiarPassword);

module.exports = router;