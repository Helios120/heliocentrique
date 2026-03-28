import express from "express";
import cors from "cors";
import Astronomy from "astronomy-engine";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const PLANETS = [
  { name: "Soleil", body: Astronomy.Body.Sun, glyph: "☉", color: "#ffb300" },
  { name: "Lune", body: Astronomy.Body.Moon, glyph: "☽", color: "#f4f2d0" },
  { name: "Mercure", body: Astronomy.Body.Mercury, glyph: "☿", color: "#ff9c3a" },
  { name: "Vénus", body: Astronomy.Body.Venus, glyph: "♀", color: "#ff86cb" },
  { name: "Mars", body: Astronomy.Body.Mars, glyph: "♂", color: "#ff5d47" },
  { name: "Jupiter", body: Astronomy.Body.Jupiter, glyph: "♃", color: "#9bb8ff" },
  { name: "Saturne", body: Astronomy.Body.Saturn, glyph: "♄", color: "#00b8ff" },
  { name: "Uranus", body: Astronomy.Body.Uranus, glyph: "♅", color: "#7dff6f" },
  { name: "Neptune", body: Astronomy.Body.Neptune, glyph: "♆", color: "#00d9ff" },
  { name: "Pluton", body: Astronomy.Body.Pluto, glyph: "♇", color: "#c66bff" }
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

const ASPECTS = [
  { name: "Conjonction", angle: 0, orb: 8 },
  { name: "Sextile", angle: 60, orb: 4 },
  { name: "Carré", angle: 90, orb: 6 },
  { name: "Trigone", angle: 120, orb: 6 },
  { name: "Opposition", angle: 180, orb: 8 }
];

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function shortestAngle(a, b) {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
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

function computePlanets(dateUtc) {
  return PLANETS.map((planet) => {
    const longitude = eclipticLongitudeOf(planet.body, dateUtc);
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
}

function buildAspects(planets) {
  const aspects = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const angle = shortestAngle(p1.longitude, p2.longitude);

      for (const aspect of ASPECTS) {
        const diff = Math.abs(angle - aspect.angle);
        if (diff <= aspect.orb) {
          aspects.push({
            p1: p1.name,
            p2: p2.name,
            aspect: aspect.name,
            exactAngle: Number(angle.toFixed(3)),
            orb: Number(diff.toFixed(3))
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

function buildEqualHousesFromAries() {
  return Array.from({ length: 12 }, (_, i) => {
    const longitude = i * 30;
    const signInfo = getSignInfo(longitude);
    return {
      house: i + 1,
      longitude,
      sign: signInfo.sign,
      degreeInSign: signInfo.degreeInSign
    };
  });
}

app.get("/", (req, res) => {
  res.send("HeliosAstro expert backend OK");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "heliosastro-expert-backend",
    engine: "astronomy-engine"
  });
});

app.post("/api/expert-chart", (req, res) => {
  try {
    const {
      date,
      time = "12:00",
      city = "",
      country = "",
      latitude = null,
      longitude = null,
      houseSystem = "P"
    } = req.body || {};

    if (!date) {
      return res.status(400).json({
        error: "La date est obligatoire."
      });
    }

    const dateUtc = buildUtcDate(date, time);
    const planets = computePlanets(dateUtc);
    const aspects = buildAspects(planets);

    const ascendantLongitude = 0;
    const mcLongitude = 90;

    const ascInfo = getSignInfo(ascendantLongitude);
    const mcInfo = getSignInfo(mcLongitude);

    const houses = buildEqualHousesFromAries();

    return res.json({
      ok: true,
      meta: {
        date,
        time,
        city,
        country,
        latitude,
        longitude,
        houseSystem,
        note: "Version expert déployable immédiatement. Planètes et aspects réels, maisons/ASC provisoires."
      },
      ascendant: {
        longitude: ascendantLongitude,
        sign: ascInfo.sign,
        degreeInSign: ascInfo.degreeInSign
      },
      mc: {
        longitude: mcLongitude,
        sign: mcInfo.sign,
        degreeInSign: mcInfo.degreeInSign
      },
      houses,
      planets,
      aspects
    });
  } catch (error) {
    return res.status(500).json({
      error: "Impossible de calculer le thème expert.",
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
  console.log(`HeliosAstro expert backend listening on port ${PORT}`);
});
