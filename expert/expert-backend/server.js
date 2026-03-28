const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/calc', (req, res) => {
  const { date, time, lat, lon } = req.body;

  const fakePlanets = [
    { name: "Soleil", degree: 71.8 },
    { name: "Lune", degree: 172.2 },
    { name: "Mercure", degree: 251.8 },
    { name: "Vénus", degree: 208.3 },
    { name: "Mars", degree: 197.3 },
    { name: "Jupiter", degree: 289.5 },
    { name: "Saturne", degree: 217.2 },
    { name: "Uranus", degree: 352.9 },
    { name: "Neptune", degree: 139.5 },
    { name: "Pluton", degree: 300.1 }
  ];

  res.json({ planets: fakePlanets });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("HeliosAstro backend running on port " + PORT);
});
