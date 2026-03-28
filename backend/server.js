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

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_ENV = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();

const PAYPAL_API_BASE =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

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
    sign: signInfo.sign,
    degreeInSign: signInfo.degreeInSign
  };
}

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID ou PAYPAL_CLIENT_SECRET manquant.");
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const rawText = await response.text();
  let data;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Réponse PayPal invalide au token OAuth.");
  }

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Token PayPal impossible.");
  }

  return data.access_token;
}

async function getPayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const rawText = await response.text();
  let data;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Réponse PayPal invalide lors de la lecture de l'ordre.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Lecture ordre PayPal impossible.");
  }

  return data;
}

app.get("/", (req, res) => {
  res.send("HeliosAstro backend OK");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "heliosastro-backend",
    engine: "swisseph-node",
    paypalEnv: PAYPAL_ENV
  });
});

app.post("/api/chart", (req, res) => {
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
        error: "La date est obligatoire au format YYYY-MM-DD."
      });
    }

    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return res.status(400).json({
        error: "Latitude et longitude sont obligatoires pour calculer Ascendant et maisons."
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
      planets
    });
  } catch (error) {
    return res.status(500).json({
      error: "Impossible de calculer le thème.",
      detail: error.message
    });
  }
});

app.get("/api/paypal/verify/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: "orderId obligatoire."
      });
    }

    const order = await getPayPalOrder(orderId);

    return res.json({
      ok: true,
      verified: order.status === "COMPLETED" || order.status === "APPROVED",
      status: order.status,
      order
    });
  } catch (error) {
    return res.status(500).json({
      error: "Vérification PayPal impossible.",
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
