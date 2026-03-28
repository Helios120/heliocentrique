const express = require("express");
const cors = require("cors");
const Astronomy = require("astronomy-engine");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_ENV = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();

const PAYPAL_API_BASE =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

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

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID ou PAYPAL_CLIENT_SECRET manquant.");
  }

  const basicAuth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Réponse PayPal token invalide.");
  }

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Token PayPal refusé.");
  }

  return data.access_token;
}

async function createPayPalOrder({ amount, currency = "EUR", description = "HeliosAstro" }) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          amount: {
            currency_code: currency,
            value: amount
          }
        }
      ]
    })
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Réponse PayPal create order invalide.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Création ordre PayPal impossible.");
  }

  return data;
}

async function capturePayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Réponse PayPal capture invalide.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Capture PayPal impossible.");
  }

  return data;
}

async function getPayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Réponse PayPal lecture ordre invalide.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Lecture ordre PayPal impossible.");
  }

  return data;
}

app.get("/", (req, res) => {
  res.send(`
    <h1>HeliosAstro Backend</h1>
    <p>Serveur actif</p>
    <p>API disponible :</p>
    <ul>
      <li>/api/health</li>
      <li>/api/calc</li>
      <li>/api/paypal/create-order</li>
      <li>/api/paypal/capture-order</li>
      <li>/api/paypal/order/:orderId</li>
    </ul>
  `);
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "heliosastro-backend",
    paypalEnv: PAYPAL_ENV
  });
});

app.post("/api/calc", (req, res) => {
  try {
    const { date, time = "12:00", city = "", country = "" } = req.body || {};

    if (!date) {
      return res.status(400).json({ error: "Date obligatoire." });
    }

    const dateUtc = buildUtcDate(date, time);
    const planets = computePlanets(dateUtc);
    const aspects = computeAspects(planets);

    return res.json({
      ok: true,
      meta: { date, time, city, country },
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

app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const { amount = "30.00", currency = "EUR", description = "Lecture HeliosAstro" } = req.body || {};
    const order = await createPayPalOrder({ amount, currency, description });
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: "Création ordre PayPal impossible.",
      detail: error.message
    });
  }
});

app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderID } = req.body || {};

    if (!orderID) {
      return res.status(400).json({ error: "orderID obligatoire." });
    }

    const capture = await capturePayPalOrder(orderID);
    res.json(capture);
  } catch (error) {
    res.status(500).json({
      error: "Capture PayPal impossible.",
      detail: error.message
    });
  }
});

app.get("/api/paypal/order/:orderId", async (req, res) => {
  try {
    const order = await getPayPalOrder(req.params.orderId);
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: "Lecture ordre PayPal impossible.",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`HeliosAstro backend running on port ${PORT}`);
});
