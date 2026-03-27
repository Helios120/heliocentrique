document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://heliosastro-backend.onrender.com";
  const { jsPDF } = window.jspdf;

  const canvas = document.getElementById("heliosCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;

  const nameInput = document.getElementById("astro-name");
  const dateInput = document.getElementById("astro-date");
  const timeInput = document.getElementById("astro-time");
  const cityInput = document.getElementById("astro-city");
  const countryInput = document.getElementById("astro-country");
  const generateBtn = document.getElementById("generate-chart-btn");
  const demoBtn = document.getElementById("demo-chart-btn");
  const exportPdfBtn = document.getElementById("export-pdf-btn");
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
    infoBox.innerHTML = html;
  }

  function setSummary(html) {
    summaryBox.innerHTML = html;
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
      degreeInSign: lon - sign.start
    };
  }

  function setLegend(planets) {
    if (!planets.length) {
      legendBox.innerHTML = `
        <strong>Répartition planétaire :</strong><br>
        Aucun repère disponible pour le moment.
      `;
      return;
    }

    legendBox.innerHTML =
      "<strong>Répartition planétaire :</strong><br>" +
      planets.map((p) => {
        const s = getSignInfo(p.longitude);
        return `${p.name} en ${s.sign} à ${s.degreeInSign.toFixed(1)}°`;
      }).join("<br>");
  }

  function buildSummary(planets) {
    if (!planets.length) {
      setSummary(`
        <strong>Synthèse du thème :</strong><br>
        Une lecture claire et élégante du thème apparaîtra ici après calcul.
      `);
      return;
    }

    const sun = planets.find(p => p.glyph === "☉");
    const moon = planets.find(p => p.glyph === "☽");
    const mercury = planets.find(p => p.glyph === "☿");
    const venus = planets.find(p => p.glyph === "♀");
    const mars = planets.find(p => p.glyph === "♂");

    const sunSign = sun ? getSignInfo(sun.longitude).sign : "—";
    const moonSign = moon ? getSignInfo(moon.longitude).sign : "—";
    const mercurySign = mercury ? getSignInfo(mercury.longitude).sign : "—";
    const venusSign = venus ? getSignInfo(venus.longitude).sign : "—";
    const marsSign = mars ? getSignInfo(mars.longitude).sign : "—";

    setSummary(`
      <strong>Synthèse du thème :</strong><br>
      Soleil en <strong>${sunSign}</strong>, Lune en <strong>${moonSign}</strong>.<br>
      La pensée s’exprime à travers <strong>${mercurySign}</strong>,
      l’affectif s’oriente vers <strong>${venusSign}</strong>,
      et l’élan d’action se concentre dans <strong>${marsSign}</strong>.
    `);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawFallbackBase() {
    clearCanvas();

    const bgGlow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 470);
    bgGlow.addColorStop(0, "rgba(0,220,255,0.08)");
    bgGlow.addColorStop(0.45, "rgba(80,120,255,0.05)");
    bgGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 470, 0, Math.PI * 2);
    ctx.fill();

    const outerR = 360;
    const signOuter = 305;
    const signInner = 240;

    ctx.strokeStyle = "rgba(255,255,255,0.95)";
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

    const centerGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 120);
    centerGlow.addColorStop(0, "rgba(255,255,255,0.95)");
    centerGlow.addColorStop(0.12, "rgba(255,226,120,0.85)");
    centerGlow.addColorStop(0.28, "rgba(0,225,255,0.40)");
    centerGlow.addColorStop(0.58, "rgba(140,0,255,0.12)");
    centerGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();

    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
    halo.addColorStop(0, "rgba(255,255,255,0.10)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawModelIfAvailable() {
    if (!modelLoaded) {
      drawFallbackBase();
      return;
    }

    clearCanvas();
    const margin = 80;
    const drawSize = size - margin * 2;
    ctx.drawImage(modelImage, margin, margin, drawSize, drawSize);

    const overlayGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150);
    overlayGlow.addColorStop(0, "rgba(255,255,255,0.20)");
    overlayGlow.addColorStop(0.18, "rgba(255,220,120,0.22)");
    overlayGlow.addColorStop(0.42, "rgba(0,220,255,0.10)");
    overlayGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = overlayGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlanetArc(longitude, color, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, degToRad(longitude - 5.5), degToRad(longitude + 5.5));
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
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
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanet(longitude, glyph, color, radius, name, index) {
    const r = degToRad(longitude);
    const x = cx + Math.cos(r) * radius;
    const y = cy + Math.sin(r) * radius;

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y + 1);

    let labelRadius = radius + 42;
    if (index % 3 === 1) labelRadius = radius + 58;
    if (index % 3 === 2) labelRadius = radius + 74;

    const lx = cx + Math.cos(r) * labelRadius;
    const ly = cy + Math.sin(r) * labelRadius;

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(name, lx, ly);
  }

  function drawChart(planets, statusText) {
    drawModelIfAvailable();

    const innerAnchorRadius = modelLoaded ? 342 : 360;
    const arcRadius = modelLoaded ? 392 : 405;
    const planetRadius = modelLoaded ? 458 : 472;

    planets.forEach((p, i) => {
      const lon = normalizeDeg(p.longitude);
      const color = p.color || "#ffffff";
      const stagger = (i % 2) * 10;
      drawPlanetArc(lon, color, arcRadius + stagger);
      drawPlanetConnector(lon, color, innerAnchorRadius, planetRadius + stagger);
    });

    planets.forEach((p, i) => {
      const lon = normalizeDeg(p.longitude);
      const color = p.color || "#ffffff";
      const stagger = (i % 2) * 10;
      drawPlanet(lon, p.glyph, color, planetRadius + stagger, p.name, i);
    });

    currentPlanets = planets;
    setInfo(statusText);
    buildSummary(planets);
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

  function exportPdf() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const clientName = (nameInput.value || "client").trim();
    const date = dateInput.value || "—";
    const time = timeInput.value || "—";
    const city = cityInput.value || "—";
    const country = countryInput.value || "—";

    const imageData = canvas.toDataURL("image/png", 1.0);

    doc.setFillColor(8, 10, 18);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("HELIOS ASTRO", 105, 16, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Nom : ${clientName}`, 14, 28);
    doc.text(`Date : ${date}`, 14, 35);
    doc.text(`Heure : ${time}`, 14, 42);
    doc.text(`Lieu : ${city}, ${country}`, 14, 49);

    doc.addImage(imageData, "PNG", 15, 58, 180, 150, "", "FAST");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Synthèse du thème", 14, 218);

    const summaryText = summaryBox.textContent.replace(/\s+/g, " ").trim();
    const summaryLines = doc.splitTextToSize(summaryText, 180);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(summaryLines, 14, 225);

    const legendText = legendBox.textContent.replace(/\s+/g, " ").trim();
    const legendLines = doc.splitTextToSize(legendText, 180);
    const legendStartY = Math.min(272, 225 + summaryLines.length * 5 + 8);

    doc.setFont("helvetica", "bold");
    doc.text("Repères planétaires", 14, legendStartY);
    doc.setFont("helvetica", "normal");
    doc.text(legendLines, 14, legendStartY + 6);

    const safeName = clientName ? clientName.replace(/\s+/g, "-").toLowerCase() : "helios-astro";
    doc.save(`${safeName}-helios-astro.pdf`);
  }

  async function generateRealChart() {
    const date = dateInput.value || "";
    const time = timeInput.value || "12:00";
    const city = cityInput.value || "Paris";
    const country = countryInput.value || "France";

    if (!date) {
      setInfo(`<strong>État de la carte :</strong><br>Merci de renseigner une date de naissance.`);
      return;
    }

    try {
      setInfo(`<strong>État de la carte :</strong><br>Calcul en cours de la carte céleste…`);

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
        `<strong>État de la carte :</strong><br>
         Carte générée avec succès pour ${date} à ${time}, ${city}, ${country}.`
      );
    } catch (error) {
      drawChart(
        demoPlanets(),
        `<strong>État de la carte :</strong><br>
         Affichage de démonstration activé. Motif : ${error.message}`
      );
    }
  }

  function drawDemo() {
    drawChart(
      demoPlanets(),
      modelLoaded
        ? `<strong>État de la carte :</strong><br>Démonstration visuelle Helios prête.`
        : `<strong>État de la carte :</strong><br>Démonstration affichée sur base de secours.`
    );
  }

  generateBtn.addEventListener("click", generateRealChart);
  demoBtn.addEventListener("click", drawDemo);
  exportPdfBtn.addEventListener("click", exportPdf);

  drawFallbackBase();
  setInfo(`
    <strong>État de la carte :</strong><br>
    Prête à être générée à partir des données de naissance.
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
