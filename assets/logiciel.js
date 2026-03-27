document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://heliosastro-backend.onrender.com";

  const canvas = document.getElementById("heliosCanvas");
  if (!canvas) {
    console.error("Canvas #heliosCanvas introuvable");
    return;
  }

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
  const summaryBox = document.getElementById("astro-summary-box");
  const legendBox = document.getElementById("astro-legend-box");

  const modelImage = new Image();
  let modelLoaded = false;
  let currentPlanets = [];

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
    "☿": "#c8c8c8",
    "♀": "#ff66cc",
    "♂": "#ff6b57",
    "♃": "#ff9800",
    "♄": "#d4af72",
    "♅": "#37d7d7",
    "♆": "#4c6fff",
    "♇": "#b06bff"
  };

  function setInfo(html) {
    if (infoBox) infoBox.innerHTML = html;
  }

  function setSummary(html) {
    if (summaryBox) summaryBox.innerHTML = html;
  }

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function getSignInfo(longitude) {
    const lon = normalizeDeg(longitude);
    const idx = Math.floor(lon / 30);
    const sign = zodiac[idx];
    return {
      sign: sign.name,
      glyph: sign.glyph,
      degreeInSign: lon - sign.start
    };
  }

  function setLegend(planets) {
    if (!legendBox) return;

    if (!planets || !planets.length) {
      legendBox.innerHTML = `
        <strong>Détails astrologiques :</strong><br>
        Aucun repère disponible pour le moment.
      `;
      return;
    }

    legendBox.innerHTML =
      "<strong>Détails astrologiques :</strong><br>" +
      planets.map((p) => {
        const s = getSignInfo(p.longitude);
        return `${p.name} en ${s.sign} à ${s.degreeInSign.toFixed(1)}°`;
      }).join("<br>");
  }

  function buildSummary(planets) {
    if (!planets || !planets.length) {
      setSummary(`
        <strong>Lecture du thème :</strong><br>
        Une synthèse claire et élégante apparaîtra ici après génération.
      `);
      return;
    }

    const sun = planets.find(p => p.glyph === "☉");
    const moon = planets.find(p => p.glyph === "☽");
    const mercury = planets.find(p => p.glyph === "☿");
    const venus = planets.find(p => p.glyph === "♀");
    const mars = planets.find(p => p.glyph === "♂");

    const sunSign = sun ? getSignInfo(sun.longitude).sign : "";
    const moonSign = moon ? getSignInfo(moon.longitude).sign : "";
    const mercurySign = mercury ? getSignInfo(mercury.longitude).sign : "";
    const venusSign = venus ? getSignInfo(venus.longitude).sign : "";
    const marsSign = mars ? getSignInfo(mars.longitude).sign : "";

    setSummary(`
      <strong>Lecture du thème :</strong><br>
      Soleil en <strong>${sunSign || "—"}</strong>, Lune en <strong>${moonSign || "—"}</strong>.<br>
      Expression mentale marquée par <strong>${mercurySign || "—"}</strong>,
      dynamique affective portée par <strong>${venusSign || "—"}</strong>,
      impulsion d’action liée à <strong>${marsSign || "—"}</strong>.
    `);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawVisibleFallbackBase() {
    clearCanvas();

    const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 420);
    glow.addColorStop(0, "rgba(0,220,255,0.10)");
    glow.addColorStop(0.5, "rgba(80,120,255,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 420, 0, Math.PI * 2);
    ctx.fill();

    const outerR = 360;
    const signOuter = 305;
    const signInner = 240;

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

    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const r = degToRad(deg);

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * signInner, cy + Math.sin(r) * signInner);
      ctx.lineTo(cx + Math.cos(r) * outerR, cy + Math.sin(r) * outerR);
      ctx.strokeStyle = "rgba(255,255,255,0.78)";
      ctx.stroke();
    }

    ctx.fillStyle = "#71e0ff";
    ctx.font = "52px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 12; i++) {
      const mid = i * 30 + 15;
      const r = degToRad(mid);
      const x = cx + Math.cos(r) * 270;
      const y = cy + Math.sin(r) * 270;
      ctx.fillText(zodiac[i].glyph, x, y);
    }

    const centerGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 100);
    centerGlow.addColorStop(0, "rgba(255,255,255,0.9)");
    centerGlow.addColorStop(0.18, "rgba(255,210,80,0.7)");
    centerGlow.addColorStop(0.45, "rgba(0,200,255,0.25)");
    centerGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawModelIfAvailable() {
    if (!modelLoaded) {
      drawVisibleFallbackBase();
      return;
    }

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

    const labelRadius = radius + (index % 2 === 0 ? 40 : 58);
    const lx = cx + Math.cos(r) * labelRadius;
    const ly = cy + Math.sin(r) * labelRadius;

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText(name, lx, ly);
  }

  function drawChart(planets, statusText) {
    drawModelIfAvailable();

    const innerAnchorRadius = modelLoaded ? 340 : 360;
    const arcRadius = modelLoaded ? 395 : 405;
    const planetRadius = modelLoaded ? 460 : 470;

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

    currentPlanets = planets;
    setInfo(statusText);
    setLegend(planets);
    buildSummary(planets);
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
    const date = dateInput?.value || "";
    const time = timeInput?.value || "12:00";
    const city = cityInput?.value || "Paris";
    const country = countryInput?.value || "France";

    if (!date) {
      setInfo(`
        <strong>Statut :</strong> merci de renseigner une date de naissance.
      `);
      return;
    }

    try {
      setInfo(`
        <strong>Statut :</strong> calcul en cours de la carte planétaire…
      `);

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

      drawChart(
        planets,
        `<strong>Statut :</strong> carte générée avec succès.<br>
         <strong>Données :</strong> ${date} ${time} — ${city}, ${country}`
      );
    } catch (error) {
      drawChart(
        demoPlanets(),
        `<strong>Statut :</strong> affichage de démonstration.<br>
         <strong>Motif :</strong> ${error.message}`
      );
    }
  }

  function drawDemo() {
    drawChart(
      demoPlanets(),
      modelLoaded
        ? `<strong>Statut :</strong> démonstration visuelle Helios prête.`
        : `<strong>Statut :</strong> démonstration affichée sur base de secours.`
    );
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateRealChart);
  }

  if (demoBtn) {
    demoBtn.addEventListener("click", drawDemo);
  }

  drawVisibleFallbackBase();
  setInfo(`
    <strong>Statut :</strong> prêt à générer votre carte.<br>
    Renseignez les données de naissance puis lancez le calcul.
  `);
  buildSummary(demoPlanets());
  setLegend(demoPlanets());

  modelImage.onload = function () {
    modelLoaded = true;
    drawDemo();
  };

  modelImage.onerror = function () {
    modelLoaded = false;
    drawDemo();
  };

  modelImage.src = "assets/helios-modele-principal.png";

  setTimeout(() => {
    if (!currentPlanets.length) {
      drawDemo();
    }
  }, 1200);
});
