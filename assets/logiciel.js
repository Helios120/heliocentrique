(function () {
  const API_BASE = "https://heliosastro-backend.onrender.com";

  const canvas = document.getElementById("heliosCanvas");
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

  const modelImage = new Image();
  let modelLoaded = false;

  modelImage.onload = function () {
    modelLoaded = true;
    drawDemo();
  };

  modelImage.onerror = function () {
    modelLoaded = false;
    setInfo("Erreur : fichier modèle introuvable. Ajoute assets/helios-modele-principal.png");
    drawBlackFallback();
  };

  modelImage.src = "assets/helios-modele-principal.png";

  const planetColors = {
    "☉": "#ffb300",
    "☽": "#4fc3ff",
    "☿": "#bfbfbf",
    "♀": "#ff66cc",
    "♂": "#ff6b57",
    "♃": "#ff9800",
    "♄": "#d4af72",
    "♅": "#37d7d7",
    "♆": "#4c6fff",
    "♇": "#b06bff"
  };

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function setInfo(text) {
    infoBox.textContent = text;
  }

  function setLegend(planets) {
    legendBox.innerHTML =
      "<strong>Positions planétaires</strong><br>" +
      planets.map((p) => `${p.glyph} ${p.name} — ${normalizeDeg(p.longitude).toFixed(1)}°`).join("<br>");
  }

  function clearCanvas() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawBlackFallback() {
    clearCanvas();
    ctx.strokeStyle = "#00d9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 330, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawModel() {
    clearCanvas();

    const margin = 80;
    const drawSize = size - margin * 2;

    ctx.drawImage(modelImage, margin, margin, drawSize, drawSize);
  }

  function drawPlanetArc(longitude, color, radius) {
    const start = longitude - 7;
    const end = longitude + 7;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, degToRad(start), degToRad(end));
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanetConnector(longitude, color, innerRadius, outerRadius) {
    const r = degToRad(longitude);

    const x1 = cx + Math.cos(r) * innerRadius;
    const y1 = cy + Math.sin(r) * innerRadius;
    const x2 = cx + Math.cos(r) * outerRadius;
    const y2 = cy + Math.sin(r) * outerRadius;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanet(longitude, glyph, color, radius, name, index) {
    const r = degToRad(longitude);
    const x = cx + Math.cos(r) * radius;
    const y = cy + Math.sin(r) * radius;

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
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y + 1);

    const labelRadius = radius + (index % 2 === 0 ? 40 : 55);
    const lx = cx + Math.cos(r) * labelRadius;
    const ly = cy + Math.sin(r) * labelRadius;

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText(name, lx, ly);
  }

  function drawChart(planets, label) {
    if (!modelLoaded) {
      drawBlackFallback();
      return;
    }

    drawModel();

    const innerAnchorRadius = 340;
    const arcRadius = 395;
    const planetRadius = 460;

    planets.forEach((p, i) => {
      const lon = normalizeDeg(p.longitude);
      const color = p.color || "#ffffff";
      const stagger = (i % 2) * 14;
      drawPlanetArc(lon, color, arcRadius + stagger);
      drawPlanetConnector(lon, color, innerAnchorRadius, planetRadius + stagger);
    });

    planets.forEach((p, i) => {
      const lon = normalizeDeg(p.longitude);
      const color = p.color || "#ffffff";
      const stagger = (i % 2) * 14;
      drawPlanet(lon, p.glyph, color, planetRadius + stagger, p.name, i);
    });

    setInfo(label);
    setLegend(planets);
  }

  function demoPlanets() {
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

  async function generateRealChart() {
    const date = dateInput.value || "";
    const time = timeInput.value || "12:00";
    const city = cityInput.value || "Paris";
    const country = countryInput.value || "France";

    if (!date) {
      setInfo("Merci de renseigner une date.");
      return;
    }

    try {
      setInfo("Calcul en cours…");
      const response = await fetch(`${API_BASE}/api/ephemeris`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ date, time, city, country })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur backend");
      }

      const planets = (data.planets || []).map((p) => ({
        name: p.name,
        glyph: p.glyph,
        longitude: p.longitude,
        color: p.color || planetColors[p.glyph] || "#ffffff"
      }));

      drawChart(planets, `Éphémérides réelles — ${date} ${time} — ${city}, ${country}`);
    } catch (error) {
      drawChart(demoPlanets(), `Backend indisponible — affichage démo (${error.message})`);
    }
  }

  function drawDemo() {
    drawChart(demoPlanets(), "Démo Helios sur ton modèle principal");
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateRealChart);
  }

  if (demoBtn) {
    demoBtn.addEventListener("click", drawDemo);
  }

  setTimeout(() => {
    if (!modelLoaded) {
      setInfo("Chargement du modèle en attente…");
    }
  }, 800);
})();
