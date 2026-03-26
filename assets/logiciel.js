(function () {
  const canvas = document.getElementById("helios-chart-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;

  const astroDate = document.getElementById("astro-date");
  const astroTime = document.getElementById("astro-time");
  const astroCity = document.getElementById("astro-city");
  const astroCountry = document.getElementById("astro-country");
  const generateBtn = document.getElementById("generate-chart-btn");
  const demoBtn = document.getElementById("demo-chart-btn");
  const infoBox = document.getElementById("astro-info-box");
  const legendBox = document.getElementById("astro-legend-box");

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

  const heliosPalette = [
    "#ff4d00",
    "#ff8a00",
    "#ffd400",
    "#7dff00",
    "#00ffd5",
    "#00b7ff",
    "#4169ff",
    "#8a2be2",
    "#ff00b7",
    "#ff3366"
  ];

  const planetStyle = {
    "☉": "#ffb300",
    "☽": "#4fc3ff",
    "☿": "#b0b0b0",
    "♀": "#ff66cc",
    "♂": "#ff5c5c",
    "♃": "#ffa64d",
    "♄": "#c9a46b",
    "♅": "#4dd0e1",
    "♆": "#5c7cff",
    "♇": "#9c27b0"
  };

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function getSignFromLongitude(longitude) {
    const deg = normalizeDeg(longitude);
    const index = Math.floor(deg / 30);
    return zodiacSigns[index];
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, size, size);
  }

  function drawBackgroundGlow() {
    const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 340);
    grad.addColorStop(0, "rgba(0,255,255,0.18)");
    grad.addColorStop(0.35, "rgba(80,120,255,0.10)");
    grad.addColorStop(0.65, "rgba(255,0,180,0.04)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 340, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCentralSpiral() {
    ctx.save();
    ctx.translate(cx, cy);

    const spiralColors = [
      "#ff2d00", "#ff8a00", "#ffe600", "#66ff00", "#00ff99",
      "#00d8ff", "#0066ff", "#5d2dff", "#b100ff", "#ff007a"
    ];

    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 8; a += 0.02) {
        const r = 25 + a * 10 + i * 4;
        const x = Math.cos(a + i * 0.28) * r * 0.60;
        const y = Math.sin(a + i * 0.28) * r * 0.60;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = spiralColors[i];
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = spiralColors[i];
      ctx.stroke();
    }

    const core = ctx.createRadialGradient(0, 0, 2, 0, 0, 60);
    core.addColorStop(0, "#fff8cc");
    core.addColorStop(0.25, "#ffd54f");
    core.addColorStop(0.5, "#2ecbff");
    core.addColorStop(1, "rgba(46,203,255,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawZodiacWheel() {
    const outerR = 350;
    const signOuterR = 300;
    const signInnerR = 235;
    const innerRingR = 220;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    // outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    // sign ring outer
    ctx.beginPath();
    ctx.arc(cx, cy, signOuterR, 0, Math.PI * 2);
    ctx.stroke();

    // sign ring inner
    ctx.beginPath();
    ctx.arc(cx, cy, signInnerR, 0, Math.PI * 2);
    ctx.stroke();

    // inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerRingR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.stroke();

    // major divisions
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const rad = degToRad(deg);
      const x1 = cx + Math.cos(rad) * signInnerR;
      const y1 = cy + Math.sin(rad) * signInnerR;
      const x2 = cx + Math.cos(rad) * outerR;
      const y2 = cy + Math.sin(rad) * outerR;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // degree ticks
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

    // degree labels every 20°
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let d = 0; d < 360; d += 20) {
      const rad = degToRad(d);
      const r = 390;
      const x = cx + Math.cos(rad) * r;
      const y = cy + Math.sin(rad) * r;
      ctx.fillText(`${d}°`, x, y);
    }

    // zodiac glyphs
    ctx.fillStyle = "#ffffff";
    ctx.font = "56px Arial";
    for (let i = 0; i < 12; i++) {
      const midDeg = i * 30 + 15;
      const rad = degToRad(midDeg);
      const r = 268;
      const x = cx + Math.cos(rad) * r;
      const y = cy + Math.sin(rad) * r;
      ctx.fillText(zodiacSigns[i].glyph, x, y);
    }
  }

  function drawPlanetArc(longitude, color) {
    const deg = normalizeDeg(longitude);
    const start = deg - 8;
    const end = deg + 8;

    ctx.beginPath();
    ctx.arc(cx, cy, 210, degToRad(start), degToRad(end));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanet(longitude, glyph, color, index) {
    const deg = normalizeDeg(longitude);
    const rad = degToRad(deg);

    const baseR = 390;
    const offset = (index % 2) * 24;
    const planetR = baseR + offset;

    const x = cx + Math.cos(rad) * planetR;
    const y = cy + Math.sin(rad) * planetR;

    // connector
    const x1 = cx + Math.cos(rad) * 350;
    const y1 = cy + Math.sin(rad) * 350;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // planet circle
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // inner highlight
    ctx.beginPath();
    ctx.arc(x - 6, y - 6, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();

    // glyph
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y + 1);
  }

  function drawHeliosChart(planets, meta) {
    clearCanvas();
    drawBackgroundGlow();
    drawCentralSpiral();
    drawZodiacWheel();

    planets.forEach((planet, index) => {
      const color = planet.color || heliosPalette[index % heliosPalette.length];
      drawPlanetArc(planet.longitude, color);
    });

    planets.forEach((planet, index) => {
      const color = planet.color || heliosPalette[index % heliosPalette.length];
      drawPlanet(planet.longitude, planet.glyph, color, index);
    });

    if (legendBox) {
      const legend = planets.map(p => {
        const sign = getSignFromLongitude(p.longitude);
        const within = (normalizeDeg(p.longitude) - sign.start).toFixed(1);
        return `${p.glyph} ${p.name} : ${within}° ${sign.name}`;
      }).join("<br>");

      legendBox.innerHTML = `<strong>Positions planétaires</strong><br>${legend}`;
    }

    if (infoBox && meta) {
      infoBox.innerHTML = `
        <p><strong>Statut :</strong> ${meta.status}</p>
        <p><strong>Mode :</strong> ${meta.mode}</p>
        <p><strong>Données :</strong> ${meta.label}</p>
      `;
    }
  }

  function getDemoPlanets() {
    return [
      { name: "Soleil", glyph: "☉", longitude: 342, color: planetStyle["☉"] },
      { name: "Lune", glyph: "☽", longitude: 22, color: planetStyle["☽"] },
      { name: "Mercure", glyph: "☿", longitude: 318, color: planetStyle["☿"] },
      { name: "Vénus", glyph: "♀", longitude: 286, color: planetStyle["♀"] },
      { name: "Mars", glyph: "♂", longitude: 90, color: planetStyle["♂"] },
      { name: "Jupiter", glyph: "♃", longitude: 215, color: planetStyle["♃"] },
      { name: "Saturne", glyph: "♄", longitude: 338, color: planetStyle["♄"] },
      { name: "Uranus", glyph: "♅", longitude: 54, color: planetStyle["♅"] },
      { name: "Neptune", glyph: "♆", longitude: 16, color: planetStyle["♆"] },
      { name: "Pluton", glyph: "♇", longitude: 301, color: planetStyle["♇"] }
    ];
  }

  async function fetchRealEphemeris(payload) {
    // Endpoint à créer côté serveur
    // Retour attendu :
    // {
    //   planets: [
    //     { name:"Soleil", glyph:"☉", longitude:123.4, color:"#ffb300" },
    //     ...
    //   ]
    // }

    const response = await fetch("/api/ephemeris", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Impossible de récupérer les éphémérides.");
    }

    return response.json();
  }

  async function generateRealChart() {
    const date = astroDate?.value || "";
    const time = astroTime?.value || "12:00";
    const city = astroCity?.value || "Paris";
    const country = astroCountry?.value || "France";

    if (!date) {
      if (infoBox) {
        infoBox.innerHTML = `
          <p><strong>Statut :</strong> erreur</p>
          <p><strong>Mode :</strong> attente</p>
          <p><strong>Note :</strong> veuillez renseigner une date.</p>
        `;
      }
      return;
    }

    const payload = { date, time, city, country };

    try {
      if (infoBox) {
        infoBox.innerHTML = `
          <p><strong>Statut :</strong> calcul en cours</p>
          <p><strong>Mode :</strong> backend éphémérides</p>
          <p><strong>Note :</strong> récupération des positions planétaires...</p>
        `;
      }

      const data = await fetchRealEphemeris(payload);

      drawHeliosChart(data.planets, {
        status: "ok",
        mode: "éphémérides réelles",
        label: `${date} ${time} — ${city}, ${country}`
      });

    } catch (error) {
      drawHeliosChart(getDemoPlanets(), {
        status: "démo affichée",
        mode: "secours local",
        label: "backend non branché — visualisation de démonstration"
      });
    }
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateRealChart);
  }

  if (demoBtn) {
    demoBtn.addEventListener("click", function () {
      drawHeliosChart(getDemoPlanets(), {
        status: "ok",
        mode: "démo Helios",
        label: "visualisation locale premium"
      });
    });
  }

  drawHeliosChart(getDemoPlanets(), {
    status: "ok",
    mode: "démo Helios",
    label: "visualisation locale premium"
  });
})();
