const express = require("express");
const cors = require("cors");
const Astronomy = require("astronomy-engine");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const PLANETS = [
  { name: "Soleil", key: Astronomy.Body.Sun, glyph: "☉", color: "#ffb300" },
  { name: "Lune", key: Astronomy.Body.Moon, glyph: "☽", color: "#4fc3ff" },
  { name: "Mercure", key: Astronomy.Body.Mercury, glyph: "☿", color: "#c8c8c8" },
  { name: "Vénus", key: Astronomy.Body.Venus, glyph: "♀", color: "#ff66cc" },
  { name: "Mars", key: Astronomy.Body.Mars, glyph: "♂", color: "#ff6b57" },
  { name: "Jupiter", key: Astronomy.Body.Jupiter, glyph: "♃", color: "#ff9800" },
  { name: "Saturne", key: Astronomy.Body.Saturn, glyph: "♄", color: "#d4af72" },
  { name: "Uranus", key: Astronomy.Body.Uranus, glyph: "♅", color: "#37d7d7" },
  { name: "Neptune", key: Astronomy.Body.Neptune, glyph: "♆", color: "#4c6fff" },
  { name: "Pluton", key: Astronomy.Body.Pluto, glyph: "♇", color: "#b06bff" }
];

const ZODIAC = [
  { name: "Bélier", start: 0 },
  { name: "Taureau", start: 30 },
  { name: "Gémeaux", start: 60 },
  { name: "Cancer", start: 90 },
  { name: "Lion", start: 120 },
  { name: "Vierge", start: 150 },
  { name: "Balance", start: 180 },
  { name: "Scorpion", start: 210 },
  { name: "Sagittaire", start: 240 },
  { name: "Capricorne", start: 270 },
  { name: "Verseau", start: 300 },
  { name: "Poissons", start: 330 }
];

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function getSignInfo(longitude) {
  const lon = normalizeDeg(longitude);
  const signIndex = Math.floor(lon / 30);
  const sign = ZODIAC[signIndex];
  return {
    sign: sign.name,
    degreeInSign: Number((lon - sign.start).toFixed(4))
  };
}

function buildUtcDate(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = (timeStr || "12:00").split(":").map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    throw new Error("Date ou heure invalide.");
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}

function eclipticLongitudeOf(body, dateUtc) {
  const geoVec = Astronomy.GeoVector(body, dateUtc, true);
  const rotation = Astronomy.Rotation_EQJ_ECT(dateUtc);
  const eclVec = Astronomy.RotateVector(rotation, geoVec);
  const sphere = Astronomy.SphereFromVector(eclVec);
  return normalizeDeg(sphere.lon);
}

app.get("/", (req, res) => {
  res.send("HeliosAstro backend OK");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "heliosastro-backend",
    engine: "astronomy-engine"
  });
});

app.post("/api/ephemeris", (req, res) => {
  try {
    const {
      date,
      time = "12:00",
      city = "",
      country = ""
    } = req.body || {};

    if (!date) {
      return res.status(400).json({
        error: "La date est obligatoire au format YYYY-MM-DD."
      });
    }

    const dateUtc = buildUtcDate(date, time);

    const planets = PLANETS.map((planet) => {
      const longitude = eclipticLongitudeOf(planet.key, dateUtc);
      const signInfo = getSignInfo(longitude);

      return {
        name: planet.name,
        glyph: planet.glyph,
        color: planet.color,
        longitude: Number(longitude.toFixed(6)),
        sign: signInfo.sign,
        degreeInSign: signInfo.degreeInSign
      };
    });

    return res.json({
      ok: true,
      meta: {
        isoUtc: dateUtc.toISOString(),
        city,
        country,
        engine: "astronomy-engine"
      },
      planets
    });
  } catch (error) {
    return res.status(500).json({
      error: "Impossible de calculer les éphémérides.",
      detail: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route introuvable."
  });
});

app.listen(PORT, () => {
  console.log(`HeliosAstro backend listening on port ${PORT}`);
});
