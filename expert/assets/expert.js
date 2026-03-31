document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://heliosastro-backend.onrender.com";
  const { jsPDF } = window.jspdf;

  const nameInput = document.getElementById("expert-name");
  const dateInput = document.getElementById("expert-date");
  const timeInput = document.getElementById("expert-time");
  const cityInput = document.getElementById("expert-city");
  const countryInput = document.getElementById("expert-country");
  const latitudeInput = document.getElementById("expert-latitude");
  const longitudeInput = document.getElementById("expert-longitude");
  const offsetInput = document.getElementById("expert-offset");

  const healthBtn = document.getElementById("health-btn");
  const generateBtn = document.getElementById("generate-btn");
  const demoBtn = document.getElementById("demo-btn");
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");
  const exportPdfBtn = document.getElementById("export-pdf-btn");

  const statusBox = document.getElementById("status-box");
  const premiumSummaryBox = document.getElementById("premium-summary-box");
  const summaryBox = document.getElementById("summary-box");
  const planetsBox = document.getElementById("planets-box");
  const aspectsBox = document.getElementById("aspects-box");
  const anglesBox = document.getElementById("angles-box");
  const housesBox = document.getElementById("houses-box");
  const privateNotes = document.getElementById("private-notes");
  const liveBadge = document.getElementById("live-badge");

  const canvas = document.getElementById("expert-canvas");
  const ctx = canvas.getContext("2d");

  const SIZE = 1600;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  let currentChart = null;

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

  const planetMeta = {
    "Soleil":   { glyph: "☉", color: "#ffb300" },
    "Lune":     { glyph: "☽", color: "#f4f2d0" },
    "Mercure":  { glyph: "☿", color: "#ff9c3a" },
    "Vénus":    { glyph: "♀", color: "#ff86cb" },
    "Mars":     { glyph: "♂", color: "#ff5d47" },
    "Jupiter":  { glyph: "♃", color: "#9bb8ff" },
    "Saturne":  { glyph: "♄", color: "#00b8ff" },
    "Uranus":   { glyph: "♅", color: "#7dff6f" },
    "Neptune":  { glyph: "♆", color: "#00d9ff" },
    "Pluton":   { glyph: "♇", color: "#c66bff" }
  };

  const aspectColors = {
    "Conjonction": "#ffffff",
    "Sextile": "#78e8ff",
    "Carré": "#ff6b6b",
    "Trigone": "#6dff9c",
    "Opposition": "#ffd369"
  };

  const demoPayload = {
    angles: {
      ascendant: { longitude: 201.0, sign: "Balance", degreeInSign: 21.0 },
      mc: { longitude: 110.0, sign: "Cancer", degreeInSign: 20.0 }
    },
    houses: Array.from({ length: 12 }, (_, i) => {
      const lon = (201 + i * 30) % 360;
      const idx = Math.floor(lon / 30);
      return {
        house: i + 1,
        longitude: lon,
        sign: zodiac[idx].name,
        degreeInSign: lon - zodiac[idx].start
      };
    }),
    planets: [
      { name: "Soleil", longitude: 71.8, sign: "Gémeaux", degreeInSign: 11.8 },
      { name: "Lune", longitude: 172.2, sign: "Vierge", degreeInSign: 22.2 },
      { name: "Mercure", longitude: 251.8, sign: "Sagittaire", degreeInSign: 11.8 },
      { name: "Vénus", longitude: 208.3, sign: "Balance", degreeInSign: 28.3 },
      { name: "Mars", longitude: 197.3, sign: "Balance", degreeInSign: 17.3 },
      { name: "Jupiter", longitude: 289.5, sign: "Capricorne", degreeInSign: 19.5 },
      { name: "Saturne", longitude: 217.2, sign: "Scorpion", degreeInSign: 7.2 },
      { name: "Uranus", longitude: 352.9, sign: "Poissons", degreeInSign: 22.9 },
      { name: "Neptune", longitude: 139.5, sign: "Lion", degreeInSign: 19.5 },
      { name: "Pluton", longitude: 300.1, sign: "Verseau", degreeInSign: 0.1 }
    ],
    aspects: [
      { p1: "Soleil", p2: "Mercure", aspect: "Opposition", exactAngle: 180.0, orb: 0.0 },
      { p1: "Vénus", p2: "Mars", aspect: "Conjonction", exactAngle: 11.0, orb: 11.0 }
    ]
  };

  function setStatus(text) {
    statusBox.innerHTML = text;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function planetPoint(longitude, radius) {
    const r = degToRad(longitude);
    return {
      x: cx + Math.cos(r) * radius,
      y: cy + Math.sin(r) * radius
    };
  }

  function adaptPlanets(rawPlanets) {
    return rawPlanets.map((p) => {
      const lon = normalizeDeg(Number(p.longitude));
      const meta = planetMeta[p.name] || { glyph: "•", color: "#ffffff" };

      return {
        name: p.name,
        glyph: meta.glyph,
        color: meta.color,
        longitude: lon,
        sign: p.sign,
        degreeInSign: p.degreeInSign
      };
    });
  }

  async function wakeBackend(maxAttempts = 8) {
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        setStatus(`Réveil du backend… tentative ${i}/${maxAttempts}`);
        const response = await fetch(`${API_BASE}/api/health?ts=${Date.now()}`, {
          method: "GET",
          cache: "no-store"
        });

        const text = await response.text();

        if (text.trim().startsWith("<")) {
          await sleep(4000);
          continue;
        }

        const data = JSON.parse(text);

        if (response.ok && data.ok) {
          liveBadge.textContent = "BACKEND OK";
          setStatus(`Backend actif : ${JSON.stringify(data)}`);
          return true;
        }
      } catch (error) {
      }

      await sleep(4000);
    }

    liveBadge.textContent = "MODE DÉMO";
    setStatus("Backend encore en veille ou non joignable. Mode démo conservé.");
    return false;
  }

  function renderPremiumSummary(planets, aspects, angles) {
    const sun = planets.find(p => p.name === "Soleil");
    const moon = planets.find(p => p.name === "Lune");
    const venus = planets.find(p => p.name === "Vénus");
    const mars = planets.find(p => p.name === "Mars");

    premiumSummaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Axe central</strong><br>Soleil en ${sun.sign} : rayonnement, cap, expression principale.</div>
        <div class="row"><strong>Vie intérieure</strong><br>Lune en ${moon.sign} : mémoire émotionnelle, sécurité, instinct.</div>
        <div class="row"><strong>Relationnel</strong><br>Vénus en ${venus.sign}, Mars en ${mars.sign} : dynamique affective et impulsion.</div>
        <div class="row"><strong>Angles</strong><br>Ascendant en ${angles.ascendant.sign}, MC en ${angles.mc.sign}.</div>
        <div class="row"><strong>Aspects clés</strong><br>${aspects.length ? aspects.slice(0, 3).map(a => `${a.p1} ${a.aspect} ${a.p2}`).join(" • ") : "Aucun aspect majeur retenu."}</div>
      </div>
    `;
  }

  function renderSummary(planets, aspects, angles) {
    const sun = planets.find(p => p.name === "Soleil");
    const moon = planets.find(p => p.name === "Lune");
    const mercury = planets.find(p => p.name === "Mercure");

    summaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Consultant :</strong> ${nameInput.value || "—"}</div>
        <div class="row"><strong>Soleil :</strong> ${sun.degreeInSign.toFixed(2)}° ${sun.sign}</div>
        <div class="row"><strong>Lune :</strong> ${moon.degreeInSign.toFixed(2)}° ${moon.sign}</div>
        <div class="row"><strong>Mercure :</strong> ${mercury.degreeInSign.toFixed(2)}° ${mercury.sign}</div>
        <div class="row"><strong>Ascendant :</strong> ${angles.ascendant.degreeInSign.toFixed(2)}° ${angles.ascendant.sign}</div>
        <div class="row"><strong>MC :</strong> ${angles.mc.degreeInSign.toFixed(2)}° ${angles.mc.sign}</div>
        <div class="row"><strong>Aspects retenus :</strong> ${aspects.length}</div>
      </div>
    `;
  }

  function renderAngles(angles) {
    anglesBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Ascendant</strong><br>${angles.ascendant.degreeInSign.toFixed(2)}° ${angles.ascendant.sign}<br><span class="muted">Longitude : ${angles.ascendant.longitude.toFixed(2)}°</span></div>
        <div class="row"><strong>Milieu du Ciel</strong><br>${angles.mc.degreeInSign.toFixed(2)}° ${angles.mc.sign}<br><span class="muted">Longitude : ${angles.mc.longitude.toFixed(2)}°</span></div>
      </div>
    `;
  }

  function renderHouses(houses) {
    housesBox.innerHTML = `
      <div class="table-like">
        ${houses.map(h => `
          <div class="row">
            <strong>Maison ${h.house}</strong><br>
            ${h.degreeInSign.toFixed(2)}° ${h.sign}<br>
            <span class="muted">Longitude : ${h.longitude.toFixed(2)}°</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderPlanetsList(planets) {
    planetsBox.innerHTML = `
      <div class="table-like">
        ${planets.map(p => `
          <div class="row">
            <strong>${p.glyph} ${p.name}</strong><br>
            ${p.degreeInSign.toFixed(2)}° ${p.sign}<br>
            <span class="muted">Longitude : ${p.longitude.toFixed(2)}°</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderAspects(aspects) {
    if (!aspects || !aspects.length) {
      aspectsBox.innerHTML = `<div class="row">Aucun aspect retenu.</div>`;
      return;
    }

    aspectsBox.innerHTML = `
      <div class="table-like">
        ${aspects.map(a => `
          <div class="row">
            <strong>${a.p1} – ${a.p2}</strong><br>
            ${a.aspect}<br>
            <span class="muted">Angle : ${Number(a.exactAngle).toFixed(2)}° | Orbe : ${Number(a.orb).toFixed(2)}°</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  function drawBackgroundGlow() {
    const glow = ctx.createRadialGradient(cx, cy, 30, cx, cy, 640);
    glow.addColorStop(0, "rgba(255,240,180,0.12)");
    glow.addColorStop(0.12, "rgba(0,220,255,0.10)");
    glow.addColorStop(0.45, "rgba(255,170,80,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 640, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPerfectWheelBase() {
    const degreeOuter = 560;
    const degreeInner = 500;
    const zodiacOuter = 470;
    const zodiacInner = 355;

    clearCanvas();
    drawBackgroundGlow();

    [degreeOuter, degreeInner, zodiacOuter, zodiacInner].forEach((r, index) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = index < 2 ? 3 : 2;
      ctx.strokeStyle = index < 2 ? "rgba(255,210,120,0.92)" : "rgba(255,255,255,0.88)";
      ctx.stroke();
    });

    for (let i = 0; i < 360; i += 2) {
      const r = degToRad(i);
      let tickInner = degreeOuter - 8;
      let width = 1;

      if (i % 10 === 0) {
        tickInner = degreeOuter - 18;
        width = 1.4;
      }

      if (i % 30 === 0) {
        tickInner = degreeOuter - 34;
        width = 2.2;
      }

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * tickInner, cy + Math.sin(r) * tickInner);
      ctx.lineTo(cx + Math.cos(r) * degreeOuter, cy + Math.sin(r) * degreeOuter);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = width;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const r = degToRad(i * 30);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * zodiacInner, cy + Math.sin(r) * zodiacInner);
      ctx.lineTo(cx + Math.cos(r) * zodiacOuter, cy + Math.sin(r) * zodiacOuter);
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const mid = i * 30 + 15;
      const p = planetPoint(mid, 410);
      ctx.fillStyle = "#ffffff";
      ctx.font = "68px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(zodiac[i].glyph, p.x, p.y);
    }
  }

  function drawCorePatternBack() {
    for (let i = 0; i < 30; i++) {
      const ratio = i / 30;
      const radius = 170 - i * 4.2;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(ratio * Math.PI * 6) * 8,
        cy + Math.sin(ratio * Math.PI * 6) * 8,
        radius,
        ratio * Math.PI * 2.3,
        ratio * Math.PI * 2.3 + Math.PI * 1.35
      );
      ctx.strokeStyle = `hsla(${ratio * 320 + 20}, 100%, 65%, ${0.45 - ratio * 0.18})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  function drawSmallCoreLight() {
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34);
    coreGlow.addColorStop(0, "rgba(255,255,255,1)");
    coreGlow.addColorStop(0.18, "rgba(255,220,120,0.95)");
    coreGlow.addColorStop(0.55, "rgba(0,210,255,0.28)");
    coreGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHouseCusps(houses) {
    houses.forEach((h, idx) => {
      const r = degToRad(h.longitude);
      const startRadius = 355;
      const endRadius = 560;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * startRadius, cy + Math.sin(r) * startRadius);
      ctx.lineTo(cx + Math.cos(r) * endRadius, cy + Math.sin(r) * endRadius);
      ctx.strokeStyle = idx === 0 ? "rgba(255,211,105,0.95)" : "rgba(120,232,255,0.55)";
      ctx.lineWidth = idx === 0 ? 3.5 : 1.6;
      ctx.stroke();

      const label = planetPoint(h.longitude, 322);
      ctx.fillStyle = idx === 0 ? "#ffd369" : "#ffffff";
      ctx.font = "22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(h.house), label.x, label.y);
    });
  }

  function drawAscMc(angles) {
    const ascPoint = planetPoint(angles.ascendant.longitude, 590);
    const mcPoint = planetPoint(angles.mc.longitude, 590);

    ctx.fillStyle = "#ffd369";
    ctx.font = "26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ASC", ascPoint.x, ascPoint.y);

    ctx.fillStyle = "#78e8ff";
    ctx.fillText("MC", mcPoint.x, mcPoint.y);
  }

  function drawAspectLine(p1, p2, color) {
    const a = planetPoint(p1.longitude, 210);
    const b = planetPoint(p2.longitude, 210);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // CORRECTION FORTE : départ visuel net au centre
  function drawCurvedFlow(longitude, color, index) {
    const r = degToRad(longitude);

    const p0x = cx;
    const p0y = cy;

    const p1Radius = 28 + (index % 3) * 6;
    const p2Radius = 120 + (index % 4) * 10;
    const p3Radius = 260 + (index % 5) * 12;
    const p4Radius = 405 + (index % 4) * 10;
    const endRadius = 520;

    const a1 = r - 0.95;
    const a2 = r - 0.55;
    const a3 = r - 0.18;
    const a4 = r - 0.04;

    const p1x = cx + Math.cos(a1) * p1Radius;
    const p1y = cy + Math.sin(a1) * p1Radius;

    const p2x = cx + Math.cos(a2) * p2Radius;
    const p2y = cy + Math.sin(a2) * p2Radius;

    const p3x = cx + Math.cos(a3) * p3Radius;
    const p3y = cy + Math.sin(a3) * p3Radius;

    const p4x = cx + Math.cos(a4) * p4Radius;
    const p4y = cy + Math.sin(a4) * p4Radius;

    const endX = cx + Math.cos(r) * endRadius;
    const endY = cy + Math.sin(r) * endRadius;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;

    // segment initial visible depuis le centre
    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p1x, p1y);
    ctx.stroke();

    // courbe principale
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.bezierCurveTo(p2x, p2y, p3x, p3y, p4x, p4y);
    ctx.stroke();

    // sortie finale
    ctx.beginPath();
    ctx.moveTo(p4x, p4y);
    ctx.quadraticCurveTo(
      cx + Math.cos(r - 0.01) * (endRadius - 60),
      cy + Math.sin(r - 0.01) * (endRadius - 60),
      endX,
      endY
    );
    ctx.stroke();

    ctx.restore();
  }

  function drawPlanetArc(longitude, color, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, degToRad(longitude - 8), degToRad(longitude + 8));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanet(longitude, glyph, color, radius, name, degreeText, index) {
    const p = planetPoint(longitude, radius);

    ctx.beginPath();
    ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, p.x, p.y + 1);

    const labelRadius = 640 + (index % 3) * 24;
    const label = planetPoint(longitude, labelRadius);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(name, label.x, label.y);

    const sub = planetPoint(longitude, labelRadius + 22);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "14px Arial";
    ctx.fillText(degreeText, sub.x, sub.y);
  }

  function renderWheel(planets, aspects, houses, angles) {
    drawPerfectWheelBase();
    drawCorePatternBack();
    drawHouseCusps(houses);

    if (aspects && aspects.length) {
      aspects.forEach((a) => {
        const p1 = planets.find(p => p.name === a.p1);
        const p2 = planets.find(p => p.name === a.p2);
        if (p1 && p2) {
          drawAspectLine(p1, p2, aspectColors[a.aspect] || "rgba(255,255,255,0.5)");
        }
      });
    }

    planets.forEach((p, i) => {
      const stagger = (i % 2) * 12;
      drawCurvedFlow(p.longitude, p.color, i);
      drawPlanetArc(p.longitude, p.color, 500 + stagger);
    });

    planets.forEach((p, i) => {
      const degreeText = `${p.degreeInSign.toFixed(1)}° ${p.sign}`;
      drawPlanet(p.longitude, p.glyph, p.color, 595 + (i % 2) * 10, p.name, degreeText, i);
    });

    drawAscMc(angles);
    drawSmallCoreLight();
  }

  function renderChart(payload) {
    const planets = payload.planets;
    const aspects = payload.aspects || [];
    const angles = payload.angles;
    const houses = payload.houses;

    currentChart = { planets, aspects, angles, houses };

    renderPremiumSummary(planets, aspects, angles);
    renderSummary(planets, aspects, angles);
    renderAngles(angles);
    renderHouses(houses);
    renderPlanetsList(planets);
    renderAspects(aspects);
    renderWheel(planets, aspects, houses, angles);
  }

  async function testHealth() {
    await wakeBackend();
  }

  async function generateChart() {
    const date = dateInput.value || "1967-12-04";
    const time = timeInput.value || "12:00";
    const city = cityInput.value || "Marseille";
    const country = countryInput.value || "France";
    const latitude = Number(latitudeInput.value || "43.2965");
    const longitude = Number(longitudeInput.value || "5.3698");
    const offset = offsetInput.value || "+01:00";

    const awake = await wakeBackend();
    if (!awake) {
      liveBadge.textContent = "MODE DÉMO";
      renderChart({
        planets: adaptPlanets(demoPayload.planets),
        aspects: demoPayload.aspects,
        angles: demoPayload.angles,
        houses: demoPayload.houses
      });
      return;
    }

    try {
      setStatus("Calcul réel en cours…");

      const response = await fetch(`${API_BASE}/api/calc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date,
          time,
          city,
          country,
          latitude,
          longitude,
          offset
        })
      });

      const text = await response.text();

      if (text.trim().startsWith("<")) {
        throw new Error("Le backend renvoie du HTML au lieu de JSON.");
      }

      const data = JSON.parse(text);

      if (!response.ok || !data.planets || !data.angles || !data.houses) {
        throw new Error("Réponse backend invalide.");
      }

      liveBadge.textContent = "CARTE LIVE";

      renderChart({
        planets: adaptPlanets(data.planets),
        aspects: data.aspects || [],
        angles: data.angles,
        houses: data.houses
      });

      setStatus(`Carte générée pour ${date} à ${time}, ${city}, ${country}.`);
    } catch (error) {
      liveBadge.textContent = "MODE DÉMO";
      renderChart({
        planets: adaptPlanets(demoPayload.planets),
        aspects: demoPayload.aspects,
        angles: demoPayload.angles,
        houses: demoPayload.houses
      });
      setStatus(`Mode démo activé. Motif : ${error.message}`);
    }
  }

  function saveLocal() {
    const payload = {
      consultant: nameInput.value || "",
      date: dateInput.value || "",
      time: timeInput.value || "",
      city: cityInput.value || "",
      country: countryInput.value || "",
      latitude: latitudeInput.value || "",
      longitude: longitudeInput.value || "",
      offset: offsetInput.value || "",
      notes: privateNotes.value || "",
      chart: currentChart
    };

    localStorage.setItem("heliosastro_premium_chart", JSON.stringify(payload));
    setStatus("Sauvegarde locale effectuée.");
  }

  function loadLocal() {
    const raw = localStorage.getItem("heliosastro_premium_chart");
    if (!raw) {
      setStatus("Aucune sauvegarde locale.");
      return;
    }

    const saved = JSON.parse(raw);
    nameInput.value = saved.consultant || "";
    dateInput.value = saved.date || "";
    timeInput.value = saved.time || "12:00";
    cityInput.value = saved.city || "";
    countryInput.value = saved.country || "";
    latitudeInput.value = saved.latitude || "43.2965";
    longitudeInput.value = saved.longitude || "5.3698";
    offsetInput.value = saved.offset || "+01:00";
    privateNotes.value = saved.notes || "";

    if (saved.chart && saved.chart.planets?.length) {
      renderChart(saved.chart);
      setStatus("Dernière sauvegarde rechargée.");
    } else {
      setStatus("Sauvegarde rechargée, sans carte.");
    }
  }

  function exportJson() {
    if (!currentChart || !currentChart.planets?.length) {
      setStatus("Aucune carte à exporter.");
      return;
    }

    const blob = new Blob(
      [JSON.stringify({
        consultant: nameInput.value || "",
        date: dateInput.value || "",
        time: timeInput.value || "",
        city: cityInput.value || "",
        country: countryInput.value || "",
        latitude: latitudeInput.value || "",
        longitude: longitudeInput.value || "",
        offset: offsetInput.value || "",
        notes: privateNotes.value || "",
        chart: currentChart
      }, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(nameInput.value || "heliosastro").replace(/\s+/g, "-").toLowerCase()}-premium.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdfPremium() {
    if (!currentChart || !currentChart.planets?.length) {
      setStatus("Aucune carte à exporter en PDF.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imageData = canvas.toDataURL("image/png", 1.0);
    const clientName = nameInput.value || "Consultant";

    doc.setFillColor(6, 9, 19);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(255, 255, 255);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("HELIOSASTRO PREMIUM", 105, 16, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nom : ${clientName}`, 14, 28);
    doc.text(`Date : ${dateInput.value || "—"}`, 14, 34);
    doc.text(`Heure : ${timeInput.value || "—"}`, 14, 40);
    doc.text(`Lieu : ${cityInput.value || "—"}, ${countryInput.value || "—"}`, 14, 46);
    doc.text(`Latitude : ${latitudeInput.value || "—"} / Longitude : ${longitudeInput.value || "—"}`, 14, 52);
    doc.text(`Fuseau : ${offsetInput.value || "—"}`, 14, 58);

    doc.addImage(imageData, "PNG", 15, 66, 180, 180, "", "FAST");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Angles et synthèse", 14, 255);

    const synth = [
      `Ascendant : ${currentChart.angles.ascendant.degreeInSign.toFixed(2)}° ${currentChart.angles.ascendant.sign}`,
      `MC : ${currentChart.angles.mc.degreeInSign.toFixed(2)}° ${currentChart.angles.mc.sign}`,
      ...currentChart.planets.slice(0, 4).map(p => `${p.name} : ${p.degreeInSign.toFixed(2)}° ${p.sign}`)
    ].join(" • ");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(synth, 180), 14, 262);

    doc.addPage();
    doc.setFillColor(6, 9, 19);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(255, 255, 255);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Maisons et positions détaillées", 14, 18);

    const houseLines = currentChart.houses.map(h =>
      `Maison ${h.house} : ${h.degreeInSign.toFixed(2)}° ${h.sign} — ${h.longitude.toFixed(2)}°`
    );

    const planetLines = currentChart.planets.map(p =>
      `${p.name} ${p.glyph} — ${p.degreeInSign.toFixed(2)}° ${p.sign} — ${p.longitude.toFixed(2)}°`
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize(houseLines.join("\n"), 85), 14, 28);
    doc.text(doc.splitTextToSize(planetLines.join("\n"), 85), 110, 28);

    doc.setFont("helvetica", "bold");
    doc.text("Aspects", 14, 210);

    const aspectsText = currentChart.aspects.length
      ? currentChart.aspects.map(a =>
          `${a.p1} ${a.aspect} ${a.p2} (orbe ${Number(a.orb).toFixed(2)}°)`
        ).join(" • ")
      : "Aucun aspect retenu.";

    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(aspectsText, 180), 14, 220);

    doc.setFont("helvetica", "bold");
    doc.text("Notes privées", 14, 245);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(privateNotes.value || "Aucune note.", 180), 14, 255);

    doc.save(`${clientName.replace(/\s+/g, "-").toLowerCase()}-heliosastro-premium.pdf`);
  }

  healthBtn.addEventListener("click", testHealth);
  generateBtn.addEventListener("click", generateChart);

  demoBtn.addEventListener("click", () => {
    liveBadge.textContent = "MODE DÉMO";
    renderChart({
      planets: adaptPlanets(demoPayload.planets),
      aspects: demoPayload.aspects,
      angles: demoPayload.angles,
      houses: demoPayload.houses
    });
    setStatus("Mode démo affiché.");
  });

  saveBtn.addEventListener("click", saveLocal);
  loadBtn.addEventListener("click", loadLocal);
  exportJsonBtn.addEventListener("click", exportJson);
  exportPdfBtn.addEventListener("click", exportPdfPremium);

  renderChart({
    planets: adaptPlanets(demoPayload.planets),
    aspects: demoPayload.aspects,
    angles: demoPayload.angles,
    houses: demoPayload.houses
  });

  setStatus("Frontend premium prêt. Les arcs partent visiblement du centre, avec ascendant et maisons.");
});
