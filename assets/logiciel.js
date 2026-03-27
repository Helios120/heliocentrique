(function () {
  const canvas = document.getElementById("helios-chart-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;

  const dateInput = document.getElementById("astro-date");
  const timeInput = document.getElementById("astro-time");
  const cityInput = document.getElementById("astro-city");
  const countryInput = document.getElementById("astro-country");
  const generateBtn = document.getElementById("generate-chart-btn");
  const demoBtn = document.getElementById("demo-chart-btn");
  const infoBox = document.getElementById("astro-info-box");
  const legendBox = document.getElementById("astro-legend-box");

  const API_BASE = "https://heliosastro-backend.onrender.com";

  const modelImage = new Image();
  modelImage.src = "assets/modele-zodiacal-helios.png";

  const zodiacSigns = [
    { name: "Bélier", glyph: "♈", start: 0 },
    { name: "Taureau", glyph: "♉", start: 30 },
    { name: "Gémeaux", glyph: "♊", start: 60 },
    { name: "Cancer", glyph: "♋", start: 90 },
    { name: "Lion", glyph: "♌", start: 120 },
    { name: "Vierge", glyph: "♍", start: 150 },
    { name: "Balance", glyph: "♎", start: 180 },
    { name: "Scorpion", glyph: "♏", start: 210 },
    { name: "Sagittaire", glyph: "♐", start: 240 },
    { name: "Capricorne", glyph: "♑", start: 270 },
    { name: "Verseau", glyph: "♒", start: 300 },
    { name: "Poissons", glyph: "♓", start: 330 }
  ];

  const planetColors = {
    "☉": "#ffb300",
    "☽": "#4fc3ff",
    "☿": "#c0c0c0",
    "♀": "#ff66cc",
    "♂": "#ff5252",
    "♃": "#ff9800",
    "♄": "#d2b48c",
    "♅": "#3ddad7",
    "♆": "#4b6cff",
    "♇": "#9c27b0"
  };

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function getSignInfo(longitude) {
    const lon = normalizeDeg(longitude);
    const signIndex = Math.floor(lon / 30);
    const sign = zodiacSigns[signIndex];
    return {
      ...sign,
      within: lon - sign.start
    };
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawModelBackground() {
    const margin = 110;
    const drawSize = size - margin * 2;
    ctx.drawImage(modelImage, margin, margin, drawSize, drawSize);
  }

  function drawCenterGlow() {
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95);
    grad.addColorStop(0, "rgba(255,255,255,0.92)");
    grad.addColorStop(0.22, "rgba(255,210,80,0.78)");
    grad.addColorStop(0.52, "rgba(0,190,255,0.32)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlanetArc(longitude, color, radius) {
    const start = longitude - 7;
    const end = longitude + 7;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, degToRad(start), degToRad(end));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanetConnector(longitude, color, fromRadius, toRadius) {
    const rad = degToRad(longitude);
    const x1 = cx + Math.cos(rad) * fromRadius;
    const y1 = cy + Math.sin(rad) * fromRadius;
    const x2 = cx + Math.cos(rad) * toRadius;
    const y2 = cy + Math.sin(rad) * toRadius;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanetBadge(longitude, glyph, color, radius, name) {
    const rad = degToRad(longitude);
    const x = cx + Math.cos(rad) * radius;
    const y = cy + Math.sin(rad) * radius;

    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x - 7, y - 7, 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y + 1);

    const labelRadius = radius + 42;
    const lx = cx + Math.cos(rad) * labelRadius;
    const ly = cy + Math.sin(rad) * labelRadius;

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(name, lx, ly);
  }

  function drawChart(planets, meta) {
    clearCanvas();
    drawModelBackground();
    drawCenterGlow();

    const connectorRadius = 392;
    const arcRadius = 430;
    const planetRadius = 500;

    planets.forEach((planet, index) => {
      const lon = normalizeDeg(planet.longitude);
      const color = planet.color || "#ffffff";
      const stagger = (index % 2) * 18;

      drawPlanetArc(lon, color, arcRadius + stagger);
      drawPlanetConnector(lon, color, connectorRadius, planetRadius + stagger);
    });

    planets.forEach((planet, index) => {
      const lon = normalizeDeg(planet.longitude);
      const color = planet.color || "#ffffff";
      const stagger = (index % 2) * 18;

      drawPlanetBadge(lon, planet.glyph, color, planetRadius + stagger, planet.name);
    });

    if (legendBox) {
      const legendHtml = planets.map((planet) => {
        const sign = getSignInfo(planet.longitude);
        return `${planet.glyph} ${planet.name} — ${sign.within.toFixed(1)}° ${sign.name}`;
      }).join("<br>");

      legendBox.innerHTML = `<strong>Positions planétaires</strong><br>${legendHtml}`;
    }

    if (infoBox) {
      infoBox.innerHTML = `
        <p><strong>Statut :</strong> ${meta.status}</p>
        <p><strong>Mode :</strong> ${meta.mode}</p>
        <p><strong>Données :</strong> ${meta.label}</p>
      `;
    }
  }

  function getDemoPlanets() {
    return [
      { name: "Soleil", glyph: "☉", longitude: 320, color: planetColors["☉"] },
      { name: "Lune", glyph: "☽", longitude: 14, color: planetColors["☽"] },
      { name: "Mercure", glyph: "☿", longitude: 301, color: planetColors["☿"] },
      { name: "Vénus", glyph: "♀", longitude: 281, color: planetColors["♀"] },
      { name: "Mars", glyph: "♂", longitude: 89, color: planetColors["♂"] },
      { name: "Jupiter", glyph: "♃", longitude: 247, color: planetColors["♃"] },
      { name: "Saturne", glyph: "♄", longitude: 155, color: planetColors["♄"] },
      { name: "Uranus", glyph: "♅", longitude: 32, color: planetColors["♅"] },
      { name: "Neptune", glyph: "♆", longitude: 18, color: planetColors["♆"] },
      { name: "Pluton", glyph: "♇", longitude: 302, color: planetColors["♇"] }
    ];
  }

  async function fetchEphemeris(payload) {
    const response = await fetch(`${API_BASE}/api/ephemeris`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Erreur backend");
    }

    return response.json();
  }

  async function generateRealChart() {
    const date = dateInput?.value || "";
    const time = timeInput?.value || "12:00";
    const city = cityInput?.value || "Paris";
    const country = countryInput?.value || "France";

    if (!date) {
      if (infoBox) {
        infoBox.innerHTML = `
          <p><strong>Statut :</strong> erreur</p>
          <p><strong>Mode :</strong> attente</p>
          <p><strong>Note :</strong> merci de renseigner une date.</p>
        `;
      }
      return;
    }

    try {
      if (infoBox) {
        infoBox.innerHTML = `
          <p><strong>Statut :</strong> calcul en cours</p>
          <p><strong>Mode :</strong> backend éphémérides</p>
          <p><strong>Note :</strong> récupération des positions planétaires…</p>
        `;
      }

      const data = await fetchEphemeris({ date, time, city, country });

      drawChart(data.planets, {
        status: "ok",
        mode: "éphémérides réelles",
        label: `${data.meta.isoUtc} — ${city}, ${country}`
      });
    } catch (error) {
      drawChart(getDemoPlanets(), {
        status: "démo affichée",
        mode: "secours local",
        label: "backend indisponible — démonstration Helios"
      });
    }
  }

  function drawDemo() {
    drawChart(getDemoPlanets(), {
      status: "ok",
      mode: "démo Helios",
      label: "visualisation locale premium"
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateRealChart);
  }

  if (demoBtn) {
    demoBtn.addEventListener("click", drawDemo);
  }

  modelImage.onload = drawDemo;
})();
