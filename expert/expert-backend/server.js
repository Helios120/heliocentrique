const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ PAGE D'ACCUEIL (IMPORTANT)
app.get('/', (req, res) => {
  res.send(`
    <h1>HeliosAstro Backend</h1>
    <p>Serveur actif</p>
    <p>API disponible :</p>
    <ul>
      <li>/api/health</li>
      <li>/api/calc</li>
    </ul>
  `);
});

// ✅ TEST
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// ✅ CALCUL PLANÈTES
app.post('/api/calc', (req, res) => {
  const { date, time } = req.body;

  const base = new Date(date + 'T' + time).getTime();

  const planets = [
    { name: "Soleil", speed: 0.01 },
    { name: "Lune", speed: 0.13 },
    { name: "Mercure", speed: 0.04 },
    { name: "Vénus", speed: 0.03 },
    { name: "Mars", speed: 0.02 },
    { name: "Jupiter", speed: 0.008 },
    { name: "Saturne", speed: 0.003 },
    { name: "Uranus", speed: 0.001 },
    { name: "Neptune", speed: 0.0006 },
    { name: "Pluton", speed: 0.0004 }
  ];

  const result = planets.map((p, i) => {
    const deg = ((base / 10000000) * p.speed * 360 + i * 36) % 360;
    return {
      name: p.name,
      degree: parseFloat(deg.toFixed(2))
    };
  });

  res.json({ planets: result });
});

// ✅ PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("HeliosAstro backend running on port " + PORT);
});
