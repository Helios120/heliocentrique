import express from "express";
import cors from "cors";
import {
  julianDay,
  calculatePosition,
  calculateHouses,
  Planet,
  HouseSystem,
  CalculationFlag
} from "@swisseph/node";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const PLANETS = [
  { name: "Soleil", key: Planet.Sun, glyph: "☉", color: "#ffb300" },
  { name: "Lune", key: Planet.Moon, glyph: "☽", color: "#f4f2d0" },
  { name: "Mercure", key: Planet.Mercury, glyph: "☿", color: "#ff9c3a" },
  { name: "Vénus", key: Planet.Venus, glyph: "♀", color: "#ff86cb" },
  { name: "Mars", key: Planet.Mars, glyph: "♂", color: "#ff5d47" },
  { name: "Jupiter", key: Planet.Jupiter, glyph: "♃", color: "#9bb8ff" },
  { name: "Saturne", key: Planet.Saturn, glyph: "♄", color: "#00b8ff" },
  { name: "Uranus", key: Planet.Uranus, glyph: "♅", color: "#7dff6f" },
  { name: "Neptune", key: Planet.Neptune, glyph: "♆", color: "#00d9ff" },
  { name: "Pluton", key: Planet.Pluto, glyph: "♇", color: "#c66bff" }
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

function parseDateTime(dateStr, timeStr) {
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

  return { year, month, day, hour, minute };
}

function buildJulianDay(dateStr, timeStr) {
  const { year, month, day, hour, minute } = parseDateTime(dateStr, timeStr);
  return julianDay(year, month, day, hour + minute / 60);
}

function positionToPayload(planet, jd) {
  const pos = calculatePosition(
    jd,
    planet.key,
    CalculationFlag.SwissEphemeris | CalculationFlag.Speed
  );

  const longitude = normalizeDeg(pos.longitude);
  const signInfo = getSignInfo(longitude);

  return {
    name: planet.name,
    glyph: planet.glyph,
    color: planet.color,
    longitude: Number(longitude.toFixed(6)),
    latitude: Number(pos.latitude.toFixed(6)),
    speed: Number(pos.longitudeSpeed.toFixed(6)),
    sign: signInfo.sign,
    degreeInSign: signInfo.degreeInSign
  };
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

app.get("/", (req, res) => {
  res.send("HeliosAstro expert backend OK");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "heliosastro-expert-backend",
    engine: "swisseph-node"
  });
});

app.post("/api/expert-chart", (req, res) => {
  try {
    const {
      date,
      time = "12:00",
      city = "",
      country = "",
      latitude,
      longitude,
      houseSystem = "P"
    } = req.body || {};

    if (!date) {
      return res.status(400).json({
        error: "La date est obligatoire."
      });
    }

    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return res.status(400).json({
        error: "Latitude et longitude obligatoires."
      });
    }

    const jd = buildJulianDay(date, time);
    const lat = Number(latitude);
    const lon = Number(longitude);

    const planets = PLANETS.map((planet) => positionToPayload(planet, jd));

    const houses = calculateHouses(
      jd,
      lat,
      lon,
      houseSystem === "W" ? HouseSystem.WholeSign : HouseSystem.Placidus
    );

    const houseCusps = [];
    for (let i = 1; i <= 12; i++) {
      const cusp = normalizeDeg(houses.cusps[i]);
      const signInfo = getSignInfo(cusp);
      houseCusps.push({
        house: i,
        longitude: Number(cusp.toFixed(6)),
        sign: signInfo.sign,
        degreeInSign: signInfo.degreeInSign
      });
    }

    const asc = normalizeDeg(houses.ascendant);
    const mc = normalizeDeg(houses.mc);

    const aspects = buildAspects(planets);

    return res.json({
      ok: true,
      meta: {
        date,
        time,
        city,
        country,
        latitude: lat,
        longitude: lon,
        jd,
        houseSystem: houseSystem === "W" ? "Whole Sign" : "Placidus"
      },
      ascendant: {
        longitude: Number(asc.toFixed(6)),
        ...getSignInfo(asc)
      },
      mc: {
        longitude: Number(mc.toFixed(6)),
        ...getSignInfo(mc)
      },
      houses: houseCusps,
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
