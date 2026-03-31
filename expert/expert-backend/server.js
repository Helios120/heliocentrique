const express = require("express");
const cors = require("cors");
const Astronomy = require("astronomy-engine");

const app = express();
const PORT = process.env.PORT || 10000;

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

function zodiacInfo(longitude) {
  const lon = normalizeDeg(longitude);
  const index = Math.floor(lon / 30);
  const sign = ZODIAC[index];
  return {
    sign: sign.name,
    degreeInSign: Number((lon - sign.start).toFixed(4))
  };
}

function parseOffsetToMinutes(offsetText) {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(offsetText || "");
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (hours * 60 + minutes);
}

function buildUtcDate(dateStr, timeStr, offsetText) {
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

  const offsetMinutes = parseOffsetToMinutes(offsetText);
  const localMillis = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const utcMillis = localMillis - offsetMinutes * 60000;

  return new Date(utcMillis);
}

function toJulianDate(dateUtc) {
  return dateUtc.getTime() / 86400000 + 2440587.5;
}

function meanObliquityDegrees(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.4392911111
    - 0.0130041667 * T
    - 0.0000001639 * T * T
    + 0.0000005036 * T * T * T;
}

function localSiderealDegrees(jd, longitudeDeg) {
  const T = (jd - 2451545.0) / 36525.0;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;

  return normalizeDeg(gmst + longitudeDeg);
}

function calculateAscendant(jd, latitudeDeg, longitudeDeg) {
  const eps = meanObliquityDegrees(jd) * Math.PI / 180;
  const lat = latitudeDeg * Math.PI / 180;
  const lst = localSiderealDegrees(jd, longitudeDeg) * Math.PI / 180;

  const y = -Math.cos(lst);
  const x = Math.sin(lst) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);

  return normalizeDeg(Math.atan2(y, x) * 180 / Math.PI);
}

function calculateMC(jd, longitudeDeg) {
  const eps = meanObliquityDegrees(jd) * Math.PI / 180;
  const lst = localSiderealDegrees(jd, longitudeDeg) * Math.PI / 180;

  let mc = Math.atan2(Math.sin(lst), Math.cos(lst) / Math.cos(eps)) * 180 / Math.PI;
  mc = normalizeDeg(mc);

  if (Math.cos(lst) < 0) {
    mc = normalizeDeg(mc + 180);
  }

  return mc;
}

function calculateEqualHouses(ascendantLongitude) {
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const longitude = normalizeDeg(ascendantLongitude + i * 30);
    const info = zodiacInfo(longitude);
    houses.push({
      house: i + 1,
      longitude: Number(longitude.toFixed(6)),
      sign: info.sign,
      degreeInSign: info.degreeInSign
    });
  }
  return houses;
}

function getEclipticLongitude(body, dateUtc) {
  const geoVector = Astronomy.GeoVector(body, dateUtc, true);
  const rotation = Astronomy.Rotation_EQJ_ECT(dateUtc);
  const eclVector = Astronomy.RotateVector(rotation, geoVector);
  const sphere = Astronomy.SphereFromVector(eclVector);
  return normalizeDeg(sphere.lon);
}

function computePlanets(dateUtc) {
  return PLANETS.map((planet) => {
    const longitude = getEclipticLongitude(planet.body, dateUtc);
    const info = zodiacInfo(longitude);

    return {
      name: planet.name,
      glyph: planet.glyph,
      color: planet.color,
      longitude: Number(longitude.toFixed(6)),
      sign: info.sign,
      degreeInSign: info.degreeInSign
    };
  });
}

function computeAspects(planets) {
  const result = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const angle = shortestAngle(p1.longitude, p2.longitude);

      for (const aspect of ASPECTS) {
        const orb = Math.abs(angle - aspect.angle);
        if (orb <= aspect.orb) {
          result.push({
            p1: p1.name,
            p2: p2.name,
            aspect: aspect.name,
            exactAngle: Number(angle.toFixed(3)),
            orb: Number(orb.toFixed(3))
          });
          break;
        }
      }
    }
  }

  return result.sort((a, b) => a.orb - b.orb);
}

app.get("/", (req, res) => {
  res.send(`
    <h1>HeliosAstro Backend</h1>
    <p>Serveur actif</p>
    <ul>
      <li>/api/health</li>
      <li>/api/calc</li>
    </ul>
  `);
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "heliosastro-backend"
  });
});

app.post("/api/calc", (req, res) => {
  try {
    const {
      date,
      time = "12:00",
      city = "",
      country = "",
      latitude = 43.2965,
      longitude = 5.3698,
      offset = "+00:00"
    } = req.body || {};

    if (!date) {
      return res.status(400).json({ error: "Date obligatoire." });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "Latitude/longitude invalides." });
    }

    const dateUtc = buildUtcDate(date, time, offset);
    const jd = toJulianDate(dateUtc);

    const planets = computePlanets(dateUtc);
    const aspects = computeAspects(planets);

    const ascendantLongitude = calculateAscendant(jd, lat, lon);
    const mcLongitude = calculateMC(jd, lon);

    const ascInfo = zodiacInfo(ascendantLongitude);
    const mcInfo = zodiacInfo(mcLongitude);
    const houses = calculateEqualHouses(ascendantLongitude);

    return res.json({
      ok: true,
      meta: {
        date,
        time,
        city,
        country,
        latitude: lat,
        longitude: lon,
        offset,
        utc: dateUtc.toISOString()
      },
      angles: {
        ascendant: {
          longitude: Number(ascendantLongitude.toFixed(6)),
          sign: ascInfo.sign,
          degreeInSign: ascInfo.degreeInSign
        },
        mc: {
          longitude: Number(mcLongitude.toFixed(6)),
          sign: mcInfo.sign,
          degreeInSign: mcInfo.degreeInSign
        }
      },
      houses,
      planets,
      aspects
    });
  } catch (error) {
    return res.status(500).json({
      error: "Calcul impossible.",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`HeliosAstro backend running on port ${PORT}`);
});
