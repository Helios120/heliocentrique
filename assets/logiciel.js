(function () {
  const canvas = document.getElementById("helios-chart-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;

  const generateBtn = document.getElementById("generate-chart-btn");
  const demoBtn = document.getElementById("demo-chart-btn");
  const infoBox = document.getElementById("astro-info-box");
  const legendBox = document.getElementById("astro-legend-box");

  const modelImage = new Image();
  modelImage.src = "assets/modele-zodiacal-helios.png";

  const planetColors = {
    "☉": "#ffb300",
    "☽": "#4fc3ff",
    "☿": "#a0a0a0",
    "♀": "#ff66cc",
    "♂": "#ff4d4d",
    "♃": "#ff9800",
    "♄": "#d2b48c",
    "♅": "#3ddad7",
    "♆": "#5c7cff",
    "♇": "#9c27b0"
  };

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawModelBackground() {
    const margin = 110;
    const drawSize = size - margin * 2;
    ctx.drawImage(modelImage, margin, margin, drawSize, drawSize);
  }

  function drawPlanetConnector(angleDeg, color, r1, r2) {
    const rad = degToRad(angleDeg);

    const x1 = cx + Math.cos(rad) * r1;
    const y1 = cy + Math.sin(rad) * r1;
    const x2 = cx + Math.cos(rad) * r2;
    const y2 = cy + Math.sin(rad) * r2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanetArc(angleDeg, color, radius) {
    const start = angleDeg - 7;
    const end = angleDeg + 7;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, degToRad(start), degToRad(end));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanetGlyph(angleDeg, glyph, color, radius, planetName) {
    const rad = degToRad(angleDeg);
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

    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y + 1);

    const tx = cx + Math.cos(rad) * (radius + 38);
    const ty = cy + Math.sin(rad) * (radius + 38);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(planetName, tx, ty);
  }

  function drawCenterGlow() {
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
    grad.addColorStop(0, "rgba(255,255,255,0.90)");
    grad.addColorStop(0.2, "rgba(255,215,100,0.75)");
    grad.addColorStop(0.5, "rgba(0,180,255,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawChart(planets, meta) {
    clearCanvas();
    drawModelBackground();
    drawCenterGlow();

    const innerConnectorRadius = 390;
    const arcRadius = 430;
    const planetRadius = 500;

    planets.forEach((planet, index) => {
      const deg = normalizeDeg(planet.longitude);
      const color = planet.color;
      const stagger = (index % 2) * 18;

      drawPlanetArc(deg, color, arcRadius + stagger);
      drawPlanetConnector(deg, color, innerConnectorRadius, planetRadius + stagger);
    });

    planets.forEach((planet, index) => {
      const deg = normalizeDeg(planet.longitude);
      const color = planet.color;
      const stagger = (index % 2) * 18;

      drawPlanetGlyph(deg, planet.glyph, color, planetRadius + stagger, planet.name);
    });

    if (legendBox) {
      legendBox.innerHTML = `<strong>Planètes affichées :</strong><br>` +
        planets.map(p => `${p.glyph} ${p.name} — ${normalizeDeg(p.longitude).toFixed(1)}°`).join("<br>");
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
      { name: "Mercure", glyph: "☿", longitude: 300, color: planetColors["☿"] },
      { name: "Vénus", glyph: "♀", longitude: 280, color: planetColors["♀"] },
      { name: "Mars", glyph: "♂", longitude: 70, color: planetColors["♂"] },
      { name: "Jupiter", glyph: "♃", longitude: 250, color: planetColors["♃"] },
      { name: "Saturne", glyph: "♄", longitude: 150, color: planetColors["♄"] },
      { name: "Uranus", glyph: "♅", longitude: 30, color: planetColors["♅"] },
      { name: "Neptune", glyph: "♆", longitude: 20, color: planetColors["♆"] },
      { name: "Pluton", glyph: "♇", longitude: 110, color: planetColors["♇"] },
      { name: "Lune", glyph: "☽", longitude: 10, color: planetColors["☽"] }
    ];
  }

  async function fetchRealEphemeris(payload) {
    const response = await fetch("/api/ephemeris", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Éphémérides non disponibles");
    }

    return response.json();
  }

  async function generateRealChart() {
    try {
      const data = await fetchRealEphemeris({});
      drawChart(data.planets, {
        status: "ok",
        mode: "éphémérides réelles",
        label: "positions planétaires exactes"
      });
    } catch (e) {
      drawChart(getDemoPlanets(), {
        status: "démo affichée",
        mode: "modèle local Helios",
        label: "backend non branché — démonstration visuelle"
      });
    }
  }

  function init() {
    drawChart(getDemoPlanets(), {
      status: "ok",
      mode: "modèle local Helios",
      label: "ton modèle zodiacal + planètes extérieures"
    });
  }

  modelImage.onload = init;

  if (demoBtn) {
    demoBtn.addEventListener("click", function () {
      drawChart(getDemoPlanets(), {
        status: "ok",
        mode: "modèle local Helios",
        label: "démo visuelle"
      });
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateRealChart);
  }
})();
