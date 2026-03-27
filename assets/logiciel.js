const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

/* =========================
   TEST ROOT (IMPORTANT)
========================= */
app.get("/", (req, res) => {
  res.send("HeliosAstro backend OK");
});

/* =========================
   API EPHEMERIDES (simple stable)
========================= */
app.post("/ephemerides", (req, res) => {
  const { date } = req.body;

  // simulation propre (remplaçable ensuite par vraie lib astro)
  const planets = [
    { name: "Soleil", degree: 120 },
    { name: "Lune", degree: 210 },
    { name: "Mercure", degree: 95 },
    { name: "Venus", degree: 180 },
    { name: "Mars", degree: 260 }
  ];

  res.json({ planets });
});

/* =========================
   GENERATION PDF CLIENT
========================= */
app.post("/generate-pdf", (req, res) => {
  const { name, date } = req.body;

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  doc.fontSize(22).text("Helios Astro", { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text(`Nom : ${name}`);
  doc.text(`Date : ${date}`);
  doc.text("Thème généré automatiquement");

  doc.end();
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
