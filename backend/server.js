const express = require("express");
const swisseph = require("swisseph");

const app = express();
app.use(express.json());

swisseph.swe_set_ephe_path(__dirname + "/ephe");

// Conversion date → Julian Day
function toJulian(date) {
  return swisseph.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600,
    swisseph.SE_GREG_CAL
  );
}

// API calcul complet
app.get("/ephemerides", (req, res) => {
  const { date, lat, lon } = req.query;

  if (!date || !lat || !lon) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  const d = new Date(date);
  const jd = toJulian(d);

  // MAISONS + ASCENDANT
  const houses = swisseph.swe_houses(jd, lat, lon, "P");

  const ascendant = houses.ascendant;
  const mc = houses.mc;
  const houseCusps = houses.house;

  // PLANÈTES
  const planets = {};
  const planetIds = {
    sun: swisseph.SE_SUN,
    moon: swisseph.SE_MOON,
    mercury: swisseph.SE_MERCURY,
    venus: swisseph.SE_VENUS,
    mars: swisseph.SE_MARS,
    jupiter: swisseph.SE_JUPITER,
    saturn: swisseph.SE_SATURN,
    uranus: swisseph.SE_URANUS,
    neptune: swisseph.SE_NEPTUNE,
    pluto: swisseph.SE_PLUTO,
  };

  for (let key in planetIds) {
    const result = swisseph.swe_calc_ut(jd, planetIds[key]);
    planets[key] = result.longitude;
  }

  res.json({
    ascendant,
    mc,
    houses: houseCusps,
    planets
  });
});

app.listen(3000, () => {
  console.log("Backend Helios Astro actif");
});
