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
    "♄": "#00b8ff",
    "♅": "#7dff6f",
    "♆": "#00d9ff",
    "♇": "#c66bff"
  };

  const demoPlanets = [
    { name: "Soleil", glyph: "☉", longitude: 71.8, color: "#ffb300" },
    { name: "Lune", glyph: "☽", longitude: 172.26, color: "#f0f0d8" },
    { name: "Mercure", glyph: "☿", longitude: 251.83, color: "#ff9c3a" },
    { name: "Vénus", glyph: "♀", longitude: 208.33, color: "#ff86cb" },
    { name: "Mars", glyph: "♂", longitude: 197.30, color: "#ff5d47" },
    { name: "Jupiter", glyph: "♃", longitude: 289.54, color: "#9bb8ff" },
    { name: "Saturne", glyph: "♄", longitude: 217.29, color: "#00b8ff" },
    { name: "Uranus", glyph: "♅", longitude: 352.93, color: "#7dff6f" },
    { name: "Neptune", glyph: "♆", longitude: 139.54, color: "#00d9ff" },
    { name: "Pluton", glyph: "♇", longitude: 330.93, color: "#c66bff" }
  ];

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

  function setInfo(html) {
    infoBox.innerHTML = html;
  }

  function setSummary(planets) {
    if (!planets.length) {
      summaryBox.innerHTML = `
        <strong>Synthèse du thème :</strong><br>
        Une lecture claire et élégante du thème apparaîtra ici après calcul.
      `;
      return;
    }

    const sun = planets.find(p => p.glyph === "☉");
    const moon = planets.find(p => p.glyph === "☽");
    const mercury = planets.find(p => p.glyph === "☿");
    const venus = planets.find(p => p.glyph === "♀");
    const mars = planets.find(p => p.glyph === "♂");

    summaryBox.innerHTML = `
      <strong>Synthèse du thème :</strong><br>
      Soleil en <strong>${getSignInfo(sun.longitude).sign}</strong>, Lune en <strong>${getSignInfo(moon.longitude).sign}</strong>.<br>
      La pensée s’exprime à travers <strong>${getSignInfo(mercury.longitude).sign}</strong>,
      l’affectif s’oriente vers <strong>${getSignInfo(venus.longitude).sign}</strong>,
      et l’élan d’action se concentre dans <strong>${getSignInfo(mars.longitude).sign}</strong>.
    `;
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

  function clearCanvas() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawFallbackBase() {
    clearCanvas();

    const bgGlow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520);
    bgGlow.addColorStop(0, "rgba(0,220,255,0.08)");
    bgGlow.addColorStop(0.4, "rgba(80,120,255,0.04)");
    bgGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 520, 0, Math.PI * 2);
    ctx.fill();

    const outerDegRing = 470;
    const zodiacOuter = 390;
    const zodiacInner = 315;
    const innerField = 255;

    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2.2;

    [outerDegRing, zodiacOuter, zodiacInner, innerField].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    for (let i = 0; i < 360; i += 2) {
      const r = degToRad(i);
      const tickOuter = outerDegRing;
      let tickInner = outerDegRing - 8;
      if (i % 10 === 0) tickInner = outerDegRing - 16;
      if (i % 30 === 0) tickInner = outerDegRing - 28;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * tickInner, cy + Math.sin(r) * tickInner);
      ctx.lineTo(cx + Math.cos(r) * tickOuter, cy + Math.sin(r) * tickOuter);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = i % 30 === 0 ? 2.4 : 1;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const r = degToRad(deg);

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * zodiacInner, cy + Math.sin(r) * zodiacInner);
      ctx.lineTo(cx + Math.cos(r) * zodiacOuter, cy + Math.sin(r) * zodiacOuter);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 12; i++) {
      const mid = i * 30 + 15;
      const r = degToRad(mid);
      const x = cx + Math.cos(r) * 350;
      const y = cy + Math.sin(r) * 350;
      ctx.font = "54px Arial";
      ctx.fillText(zodiac[i].glyph, x, y);
    }

    for (let i = 0; i < 360; i += 30) {
      const r = degToRad(i);
      const x = cx + Math.cos(r) * 515;
      const y = cy + Math.sin(r) * 515;
      ctx.font = "24px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(`${i}°`, x, y);
    }

    drawHeliosCore();
  }

  function drawHeliosCore() {
    const coreGlow = ctx.createRadialGradient(cx, cy, 15, cx, cy, 140);
    coreGlow.addColorStop(0, "rgba(255,255,255,1)");
    coreGlow.addColorStop(0.12, "rgba(255,220,100,0.95)");
    coreGlow.addColorStop(0.32, "rgba(0,230,255,0.35)");
    coreGlow.addColorStop(0.62, "rgba(180,50,255,0.10)");
    coreGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.fill();

    const colors = [
      "#ff2d55","#ff7a00","#ffd400","#7dff00","#00e5ff","#0062ff","#9b00ff","#ff4fb3"
    ];

    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = colors[i];

      for (let a = 0; a <= Math.PI * 6; a += 0.05) {
        const rr = 12 + a * 17 + i * 5;
        const x = cx + Math.cos(a + i * 0.15) * rr;
        const y = cy + Math.sin(a + i * 0.15) * rr;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#fff8d0";
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
    overlayGlow.addColorStop(0, "rgba(255,255,255,0.18)");
    overlayGlow.addColorStop(0.2, "rgba(255,220,120,0.20)");
    overlayGlow.addColorStop(0.45, "rgba(0,220,255,0.08)");
    overlayGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = overlayGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCurvedFlow(longitude, color, index) {
    const r = degToRad(longitude);

    const startRadius = 120;
    const endRadius = 520;
    const bendRadius1 = 210 + (index % 4) * 10;
    const bendRadius2 = 340 + (index % 5) * 14;

    const startX = cx + Math.cos(r - 0.18) * startRadius;
    const startY = cy + Math.sin(r - 0.18) * startRadius;

    const cp1X = cx + Math.cos(r - 0.55) * bendRadius1;
    const cp1Y = cy + Math.sin(r - 0.55) * bendRadius1;

    const cp2X = cx + Math.cos(r - 0.15) * bendRadius2;
    const cp2Y = cy + Math.sin(r - 0.15) * bendRadius2;

    const endX = cx + Math.cos(r) * endRadius;
    const endY = cy + Math.sin(r) * endRadius;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanetArc(longitude, color, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, degToRad(longitude - 8), degToRad(longitude + 8));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
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
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 16;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x - 6, y - 6, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y + 1);

    let labelRadius = radius + 50;
    if (index % 3 === 1) labelRadius = radius + 72;
    if (index % 3 === 2) labelRadius = radius + 92;

    const lx = cx + Math.cos(r) * labelRadius;
    const ly = cy + Math.sin(r) * labelRadius;

    ctx.fillStyle = "#ffffff";
    ctx.font = "19px Arial";
    ctx.fillText(name, lx, ly);

    const signInfo = getSignInfo(longitude);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "15px Arial";
    ctx.fillText(
      `${signInfo.degreeInSign.toFixed(1)}° ${signInfo.sign}`,
      cx + Math.cos(r) * (labelRadius + 24),
      cy + Math.sin(r) * (labelRadius + 24)
    );
  }

  function drawChart(planets) {
    drawModelIfAvailable();

    const innerAnchorRadius = modelLoaded ? 380 : 392;
    const arcRadius = modelLoaded ? 470 : 484;
    const planetRadius = modelLoaded ? 560 : 574;

    planets.forEach((p, i) => {
      const lon = normalizeDeg(p.longitude);
      const color = p.color || "#ffffff";
      const stagger = (i % 2) * 14;
      drawCurvedFlow(lon, color, i);
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
    setSummary(planets);
    setLegend(planets);
  }

  async function generateRealChart() {
    const date = dateInput.value || "";
    const time = timeInput.value || "12:00";
    const city = cityInput.value || "Paris";
    const country = countryInput.value || "France";

    if (!date) {
      setInfo("<strong>État de la carte :</strong><br>Merci de renseigner une date de naissance.");
      return;
    }

    try {
      setInfo("<strong>État de la carte :</strong><br>Calcul en cours de la carte céleste…");

      const response = await fetch(`${API_BASE}/api/ephemeris`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ date, time, city, country })
      });

      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Le backend renvoie du HTML ou un JSON invalide.");
      }

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Erreur backend");
      }

      const planets = (data.planets || []).map((p) => ({
        name: p.name,
        glyph: p.glyph,
        longitude: Number(p.longitude),
        color: p.color || planetColors[p.glyph] || "#ffffff"
      }));

      drawChart(planets);
      setInfo(`
        <strong>État de la carte :</strong><br>
        Carte générée avec succès pour ${date} à ${time}, ${city}, ${country}.
      `);
    } catch (error) {
      drawChart(demoPlanets);
      setInfo(`
        <strong>État de la carte :</strong><br>
        Affichage de démonstration activé. Motif : ${error.message}
      `);
    }
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

    doc.addImage(imageData, "PNG", 10, 56, 190, 155, "", "FAST");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Synthèse du thème", 14, 220);

    const summaryText = summaryBox.textContent.replace(/\s+/g, " ").trim();
    const summaryLines = doc.splitTextToSize(summaryText, 180);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(summaryLines, 14, 227);

    const legendText = legendBox.textContent.replace(/\s+/g, " ").trim();
    const legendLines = doc.splitTextToSize(legendText, 180);
    const legendStartY = Math.min(272, 227 + summaryLines.length * 5 + 8);

    doc.setFont("helvetica", "bold");
    doc.text("Repères planétaires", 14, legendStartY);
    doc.setFont("helvetica", "normal");
    doc.text(legendLines, 14, legendStartY + 6);

    const safeName = clientName ? clientName.replace(/\s+/g, "-").toLowerCase() : "helios-astro";
    doc.save(`${safeName}-helios-astro.pdf`);
  }

  generateBtn.addEventListener("click", generateRealChart);
  demoBtn.addEventListener("click", () => {
    drawChart(demoPlanets);
    setInfo("<strong>État de la carte :</strong><br>Démonstration visuelle Helios prête.");
  });
  exportPdfBtn.addEventListener("click", exportPdf);

  drawFallbackBase();
  drawChart(demoPlanets);
  setInfo(`
    <strong>État de la carte :</strong><br>
    Prête à être générée à partir des données de naissance.
  `);

  modelImage.onload = function () {
    modelLoaded = true;
    drawChart(currentPlanets.length ? currentPlanets : demoPlanets);
  };

  modelImage.onerror = function () {
    modelLoaded = false;
    drawChart(currentPlanets.length ? currentPlanets : demoPlanets);
  };

  modelImage.src = "assets/helios-modele-principal.png";
});
