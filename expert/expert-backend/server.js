const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// PORT Render obligatoire
const PORT = process.env.PORT || 10000;

// TEST
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// CALCUL PLANETES (simulation propre)
app.post('/api/calc', (req, res) => {

  const { date, time } = req.body;

  // simulation réaliste (remplacera swiss ephemeris plus tard)
  const planets = [
    { name: "Soleil", lon: Math.random() * 360 },
    { name: "Lune", lon: Math.random() * 360 },
    { name: "Mercure", lon: Math.random() * 360 },
    { name: "Vénus", lon: Math.random() * 360 },
    { name: "Mars", lon: Math.random() * 360 },
    { name: "Jupiter", lon: Math.random() * 360 },
    { name: "Saturne", lon: Math.random() * 360 },
    { name: "Uranus", lon: Math.random() * 360 },
    { name: "Neptune", lon: Math.random() * 360 },
    { name: "Pluton", lon: Math.random() * 360 }
  ];

  res.json({
    success: true,
    planets
  });
});

// LANCEMENT
app.listen(PORT, () => {
  console.log("✅ HeliosAstro backend running on port " + PORT);
});
