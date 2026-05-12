require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/api/auth",        require("./routes/authRoutes"));
//app.use("/api/usuarios",    require("./routes/usuariosRoutes"));
app.use("/api/pacientes",   require("./routes/pacientesRoutes"));
app.use("/api/citas",       require("./routes/citasRoutes"));
app.use("/api/historiales", require("./routes/historialesRoutes"));
app.use("/api/pagos",       require("./routes/pagosRoutes"));

// Servir componentes
app.use("/components", express.static(path.join(__dirname, "components")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DentalRaúl corriendo en http://localhost:${PORT}`);
});