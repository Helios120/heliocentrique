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

  const zodiac = [
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
    "☿": "#bfbfbf",
    "♀": "#ff66cc",
    "♂": "#ff5252",
    "♃": "#ff9800",
    "♄": "#cda86a",
    "♅": "#38d9d9",
    "♆": "#4f6fff",
    "♇": "#9c27b0"
  };

  const modelImage = new Image();
  let modelReady = false;
  modelImage.onload = function () {
    modelReady = true;
    drawDemo();
  };
  modelImage.onerror = function () {
    modelReady = false;
    drawDemo();
  };
  modelImage.src = "assets/modele-zodiacal-helios.png";

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function getSignInfo(longitude) {
    const lon = normalizeDeg(longitude);
    const index = Math.floor(lon / 30);
    const sign = zodiac[index];
    return {
      sign: sign.name,
      glyph: sign.glyph,
      degreeInSign: lon - sign.start
    };
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawFallbackWheel() {
    const outerR = 360;
    const signOuter = 310;
    const signInner = 245;

    // glow
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 420);
    g.addColorStop(0, "rgba(0,180,255,0.08)");
    g.addColorStop(0.55, "rgba(70,100,255,0.04)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 420, 0, Math.PI * 2);
    ctx.fill();

    // circles
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, signOuter, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, signInner, 0, Math.PI * 2);
    ctx.stroke();

    // divisions
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const rad = degToRad(deg);
      const x1 = cx + Math.cos(rad) * signInner;
      const y1 = cy + Math.sin(rad) * signInner;
      const x2 = cx + Math.cos(rad) * outerR;
      const y2 = cy + Math.sin(rad) * outerR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // ticks
    for (let d = 0; d < 360; d++) {
      const rad = degToRad(d);
      const r1 = outerR;
      const r2 = d % 10 === 0 ? outerR - 18 : outerR - 8;

      const x1 = cx + Math.cos(rad) * r1;
      const y1 = cy + Math.sin(rad) * r1;
      const x2 = cx + Math.cos(rad) * r2;
      const y2 = cy + Math.sin(rad) * r2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = d % 10 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // glyphs
    ctx.fillStyle = "#ffffff";
    ctx.font = "56px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 12; i++) {
      const midDeg = i * 30 + 15;
      const rad = degToRad(midDeg);
      const r = 275;
      const x = cx + Math.cos(rad) * r;
      const y = cy + Math.sin(rad) * r;
      ctx.fillText(zodiac[i].glyph, x, y);
    }

    // center glow
    const c = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95);
    c.addColorStop(0, "rgba(255,255,255,0.9)");
    c.addColorStop(0.2, "rgba(255,215,80,0.75)");
    c.addColorStop(0.5, "rgba(0,190,255,0.30)");
    c.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawModelOrFallback() {
    if (modelReady) {
      const margin = 100;
      const drawSize = size - margin * 2;
      ctx.drawImage(modelImage, margin, margin, drawSize, drawSize);
    } else {
      drawFallbackWheel();
    }
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

  function drawPlanetConnector(longitude, color, fromR, toR) {
    const rad = degToRad(longitude);
    const x1 = cx + Math.cos(rad) * fromR;
    const y1 = cy + Math.sin(rad) * fromR;
    const x2 = cx + Math.cos(rad) * toR;
    const y2 = cy + Math.sin(rad) * toR;

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

  function drawPlanet(longitude, glyph, color, radius, name) {
    const rad = degToRad(longitude);
    const x = cx + Math.cos(rad) * radius;
    const y = cy + Math.sin(rad) * radius;

    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 16;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x - 6, y - 6, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y + 1);

    const lx = cx + Math.cos(rad) * (radius + 40);
    const ly = cy + Math.sin(rad) * (radius + 40);
    ctx.font = "18px Arial";
    ctx.fillText(name, lx, ly);
  }

  function drawChart(planets, meta) {
    clearCanvas();
    drawModelOrFallback();

    const connectorRadius = modelReady ? 392 : 360;
    const arcRadius = modelReady ? 430 : 395;
    const planetRadius = modelReady ? 500 : 455;

    planets.forEach((p, i) => {
      const lon = normalizeDeg(p.longitude);
      const stagger = (i % 2) * 18;
      drawPlanetArc(lon, p.color, arcRadius + stagger);
      drawPlanetConnector(lon, p.color, connectorRadius, planetRadius + stagger);
    });

    planets.forEach((p, i) => {
      const lon = normalizeDeg(p.longitude);
      const stagger = (i % 2) * 18;
      drawPlanet(lon, p.glyph, p.color, planetRadius + stagger, p.name);
    });

    if (legendBox) {
      legendBox.innerHTML =
        "<strong>Positions planétaires</strong><br>" +
        planets.map((p) => {
          const s = getSignInfo(p.longitude);
          return `${p.glyph} ${p.name} — ${s.degreeInSign.toFixed(1)}° ${s.sign}`;
        }).join("<br>");
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

  async function fetchHealth() {
    const response = await fetch(`${API_BASE}/api/health`);
    if (!response.ok) {
      throw new Error("Backend indisponible");
    }
    return response.json();
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
      throw new Error("Erreur backend");
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
          <p><strong>Mode :</strong> backend Render</p>
          <p><strong>Note :</strong> récupération des positions planétaires…</p>
        `;
      }

      await fetchHealth();
      const data = await fetchEphemeris({ date, time, city, country });

      const planets = data.planets.map((p) => ({
        name: p.name,
        glyph: p.glyph,
        longitude: p.longitude,
        color: p.color || "#ffffff"
      }));

      drawChart(planets, {
        status: "ok",
        mode: "éphémérides réelles",
        label: `${date} ${time} — ${city}, ${country}`
      });
    } catch (error) {
      drawChart(getDemoPlanets(), {
        status: "démo affichée",
        mode: "secours local",
        label: "backend inaccessible ou en réveil"
      });
    }
  }

  function drawDemo() {
    drawChart(getDemoPlanets(), {
      status: "ok",
      mode: modelReady ? "modèle Helios + démo" : "roue de secours + démo",
      label: modelReady ? "modèle zodiacal personnalisé chargé" : "image modèle absente — fallback actif"
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateRealChart);
  }

  if (demoBtn) {
    demoBtn.addEventListener("click", drawDemo);
  }

  // Sécurité : si l’image ne charge pas, on dessine quand même après 1 seconde.
  setTimeout(drawDemo, 1000);
})();
