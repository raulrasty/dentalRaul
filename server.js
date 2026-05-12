require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/api/auth",        require("./routes/auth"));
app.use("/api/pacientes",   require("./routes/pacientes"));
app.use("/api/citas",       require("./routes/citas"));
app.use("/api/historiales", require("./routes/historiales"));
app.use("/api/pagos",       require("./routes/pagos"));

// Ruta raíz → login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DentalRaúl corriendo en http://localhost:${PORT}`);
});