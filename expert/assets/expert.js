document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://heliosastro-backend.onrender.com";
  const { jsPDF } = window.jspdf;

  const nameInput = document.getElementById("expert-name");
  const dateInput = document.getElementById("expert-date");
  const timeInput = document.getElementById("expert-time");
  const cityInput = document.getElementById("expert-city");
  const countryInput = document.getElementById("expert-country");

  const healthBtn = document.getElementById("health-btn");
  const generateBtn = document.getElementById("generate-btn");
  const demoBtn = document.getElementById("demo-btn");
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");
  const exportPdfBtn = document.getElementById("export-pdf-btn");
  const installBtn = document.getElementById("install-btn");

  const statusBox = document.getElementById("status-box");
  const summaryBox = document.getElementById("summary-box");
  const planetsBox = document.getElementById("planets-box");
  const aspectsBox = document.getElementById("aspects-box");
  const privateNotes = document.getElementById("private-notes");

  const canvas = document.getElementById("expert-canvas");
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;

  const wheelImage = new Image();
  let wheelLoaded = false;
  let currentChart = null;
  let deferredPrompt = null;
  let pdfUnlocked = false;

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

  function setStatus(html) {
    statusBox.innerHTML = html;
  }

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function signInfo(longitude) {
    const lon = normalizeDeg(longitude);
    const idx = Math.floor(lon / 30);
    return {
      sign: zodiac[idx].name,
      glyph: zodiac[idx].glyph,
      degreeInSign: lon - zodiac[idx].start
    };
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
      let lon = p.longitude;
      if (typeof lon !== "number") lon = Number(p.degree);
      lon = normalizeDeg(lon);

      const meta = planetMeta[p.name] || { glyph: "•", color: "#ffffff" };
      const s = typeof p.sign === "string" && typeof p.degreeInSign === "number"
        ? { sign: p.sign, degreeInSign: p.degreeInSign }
        : signInfo(lon);

      return {
        name: p.name,
        glyph: meta.glyph,
        color: meta.color,
        longitude: lon,
        sign: s.sign,
        degreeInSign: s.degreeInSign
      };
    });
  }

  function renderSummary(planets, aspects) {
    const sun = planets.find(p => p.name === "Soleil");
    const moon = planets.find(p => p.name === "Lune");
    const mercury = planets.find(p => p.name === "Mercure");

    summaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Consultant :</strong> ${nameInput.value || "—"}</div>
        <div class="row"><strong>Soleil :</strong> ${sun.degreeInSign.toFixed(2)}° ${sun.sign}</div>
        <div class="row"><strong>Lune :</strong> ${moon.degreeInSign.toFixed(2)}° ${moon.sign}</div>
        <div class="row"><strong>Mercure :</strong> ${mercury.degreeInSign.toFixed(2)}° ${mercury.sign}</div>
        <div class="row"><strong>PDF premium :</strong> ${pdfUnlocked ? '<span class="badge ok">déverrouillé</span>' : '<span class="badge warn">verrouillé</span>'}</div>
        <div class="row"><strong>Aspects retenus :</strong> ${aspects.length}</div>
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
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawFallbackWheel() {
    clearCanvas();

    const degreeOuter = 500;
    const zodiacOuter = 410;
    const zodiacInner = 330;

    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 520);
    glow.addColorStop(0, "rgba(255,255,255,0.10)");
    glow.addColorStop(0.16, "rgba(255,210,90,0.16)");
    glow.addColorStop(0.36, "rgba(0,220,255,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 520, 0, Math.PI * 2);
    ctx.fill();

    [degreeOuter, zodiacOuter, zodiacInner].forEach((r) => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    for (let i = 0; i < 360; i += 2) {
      const r = degToRad(i);
      let tickInner = degreeOuter - 8;
      if (i % 10 === 0) tickInner = degreeOuter - 18;
      if (i % 30 === 0) tickInner = degreeOuter - 34;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * tickInner, cy + Math.sin(r) * tickInner);
      ctx.lineTo(cx + Math.cos(r) * degreeOuter, cy + Math.sin(r) * degreeOuter);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = i % 30 === 0 ? 2.2 : 1;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const r = degToRad(i * 30);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(r) * zodiacInner, cy + Math.sin(r) * zodiacInner);
      ctx.lineTo(cx + Math.cos(r) * zodiacOuter, cy + Math.sin(r) * zodiacOuter);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const mid = i * 30 + 15;
      const p = planetPoint(mid, 370);
      ctx.fillStyle = "#ffffff";
      ctx.font = "56px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(zodiac[i].glyph, p.x, p.y);
    }
  }

  function drawWheelBase() {
    if (!wheelLoaded) {
      drawFallbackWheel();
      return;
    }

    clearCanvas();
    const margin = 80;
    const drawSize = size - margin * 2;
    ctx.drawImage(wheelImage, margin, margin, drawSize, drawSize);
  }

  function drawCurvedFlow(longitude, color, index) {
    const r = degToRad(longitude);
    const startRadius = 120;
    const endRadius = 520;
    const bendRadius1 = 210 + (index % 4) * 12;
    const bendRadius2 = 340 + (index % 5) * 16;

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
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
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

    const labelRadius = 625 + (index % 3) * 28;
    const label = planetPoint(longitude, labelRadius);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(name, label.x, label.y);

    const sub = planetPoint(longitude, labelRadius + 24);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "14px Arial";
    ctx.fillText(degreeText, sub.x, sub.y);
  }

  function renderWheel(planets, aspects) {
    drawWheelBase();

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
      drawPlanetArc(p.longitude, p.color, 470 + stagger);
    });

    planets.forEach((p, i) => {
      const degreeText = `${p.degreeInSign.toFixed(1)}° ${p.sign}`;
      drawPlanet(p.longitude, p.glyph, p.color, 575 + (i % 2) * 12, p.name, degreeText, i);
    });
  }

  function renderChart(payload) {
    const planets = payload.planets;
    const aspects = payload.aspects || [];
    currentChart = { planets, aspects };

    renderSummary(planets, aspects);
    renderPlanetsList(planets);
    renderAspects(aspects);
    renderWheel(planets, aspects);
  }

  async function testHealth() {
    try {
      setStatus("Test backend en cours…");
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Réponse backend invalide");
      }

      setStatus(`<span class="badge ok">Backend OK</span> ${JSON.stringify(data)}`);
    } catch (error) {
      setStatus(`<span class="badge warn">Erreur backend</span> ${error.message}`);
    }
  }

  async function generateChart() {
    const date = dateInput.value || "2026-03-28";
    const time = timeInput.value || "12:00";
    const city = cityInput.value || "Paris";
    const country = countryInput.value || "France";

    try {
      setStatus("Calcul réel en cours…");

      const response = await fetch(`${API_BASE}/api/calc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ date, time, city, country })
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Le backend ne renvoie pas un JSON valide.");
      }

      if (!response.ok || !data.planets) {
        throw new Error("Réponse backend invalide.");
      }

      const payload = {
        planets: adaptPlanets(data.planets),
        aspects: data.aspects || []
      };

      renderChart(payload);
      setStatus(`<span class="badge ok">Carte générée</span> ${date} à ${time}, ${city}, ${country}.`);
    } catch (error) {
      renderChart({
        planets: adaptPlanets(demoPayload.planets),
        aspects: demoPayload.aspects
      });
      setStatus(`<span class="badge warn">Mode démo</span> ${error.message}`);
    }
  }

  function saveLocal() {
    const payload = {
      consultant: nameInput.value || "",
      date: dateInput.value || "",
      time: timeInput.value || "",
      city: cityInput.value || "",
      country: countryInput.value || "",
      notes: privateNotes.value || "",
      pdfUnlocked,
      chart: currentChart
    };

    localStorage.setItem("heliosastro_expert_frontend", JSON.stringify(payload));
    setStatus("Sauvegarde locale effectuée.");
  }

  function loadLocal() {
    const raw = localStorage.getItem("heliosastro_expert_frontend");
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
    privateNotes.value = saved.notes || "";
    pdfUnlocked = Boolean(saved.pdfUnlocked);

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
        notes: privateNotes.value || "",
        chart: currentChart
      }, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(nameInput.value || "heliosastro").replace(/\s+/g, "-").toLowerCase()}-chart.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdfPremium() {
    if (!currentChart || !currentChart.planets?.length) {
      setStatus("Aucune carte à exporter en PDF.");
      return;
    }

    if (!pdfUnlocked) {
      setStatus(`<span class="badge warn">PDF verrouillé</span> Règle d’abord le paiement PayPal.`);
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
    doc.text("HELIOSASTRO", 105, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Consultant : ${clientName}`, 14, 30);
    doc.text(`Date : ${dateInput.value || "—"}   Heure : ${timeInput.value || "—"}`, 14, 37);
    doc.text(`Lieu : ${cityInput.value || "—"}, ${countryInput.value || "—"}`, 14, 44);

    doc.addImage(imageData, "PNG", 10, 52, 190, 150, "", "FAST");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Synthèse premium", 14, 214);

    const synth = currentChart.planets.map(p =>
      `${p.name} : ${p.degreeInSign.toFixed(2)}° ${p.sign}`
    ).join(" • ");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(synth, 180), 14, 222);

    doc.setFont("helvetica", "bold");
    doc.text("Aspects", 14, 246);
    doc.setFont("helvetica", "normal");
    const aspectsText = currentChart.aspects.length
      ? currentChart.aspects.map(a =>
          `${a.p1} ${a.aspect} ${a.p2} (orbe ${Number(a.orb).toFixed(2)}°)`
        ).join(" • ")
      : "Aucun aspect retenu.";
    doc.text(doc.splitTextToSize(aspectsText, 180), 14, 254);

    doc.addPage();
    doc.setFillColor(6, 9, 19);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(255, 255, 255);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Positions détaillées", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = currentChart.planets.map(p =>
      `${p.name} ${p.glyph} — ${p.degreeInSign.toFixed(2)}° ${p.sign} — longitude ${p.longitude.toFixed(2)}°`
    );
    doc.text(doc.splitTextToSize(lines.join("\n"), 180), 14, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Notes privées", 14, 220);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(privateNotes.value || "Aucune note.", 180), 14, 230);

    doc.save(`${clientName.replace(/\s+/g, "-").toLowerCase()}-heliosastro-premium.pdf`);
  }

  async function renderPayPalButtons() {
    if (!window.paypal) return;

    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "pill",
        label: "pay"
      },

      createOrder: async () => {
        const response = await fetch(`${API_BASE}/api/paypal/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: "30.00",
            currency: "EUR",
            description: "Lecture HeliosAstro premium"
          })
        });

        const order = await response.json();
        if (!order.id) {
          throw new Error("Création PayPal impossible.");
        }
        return order.id;
      },

      onApprove: async (data) => {
        const response = await fetch(`${API_BASE}/api/paypal/capture-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID })
        });

        const capture = await response.json();

        if (capture.status === "COMPLETED" || capture.status === "APPROVED") {
          pdfUnlocked = true;
          localStorage.setItem("heliosastro_pdf_unlocked", "1");
          setStatus(`<span class="badge ok">Paiement validé</span> PDF premium déverrouillé.`);
          if (currentChart) {
            renderSummary(currentChart.planets, currentChart.aspects || []);
          }
        } else {
          throw new Error("Paiement non validé.");
        }
      },

      onError: (err) => {
        setStatus(`<span class="badge warn">PayPal</span> ${err.message || err}`);
      }
    }).render("#paypal-button-container");
  }

  function registerPWA() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      installBtn.classList.remove("hidden");
    });

    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.classList.add("hidden");
    });
  }

  healthBtn.addEventListener("click", async () => {
    try {
      setStatus("Test backend en cours…");
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Réponse backend invalide");
      }

      setStatus(`<span class="badge ok">Backend OK</span> ${JSON.stringify(data)}`);
    } catch (error) {
      setStatus(`<span class="badge warn">Erreur backend</span> ${error.message}`);
    }
  });

  generateBtn.addEventListener("click", generateChart);

  demoBtn.addEventListener("click", () => {
    renderChart({
      planets: adaptPlanets(demoPayload.planets),
      aspects: demoPayload.aspects
    });
    setStatus("Mode démo affiché.");
  });

  saveBtn.addEventListener("click", saveLocal);
  loadBtn.addEventListener("click", loadLocal);
  exportJsonBtn.addEventListener("click", exportJson);
  exportPdfBtn.addEventListener("click", exportPdfPremium);

  wheelImage.onload = function () {
    wheelLoaded = true;
    if (currentChart) renderChart(currentChart);
  };

  wheelImage.onerror = function () {
    wheelLoaded = false;
    if (currentChart) renderChart(currentChart);
  };

  wheelImage.src = "assets/roue-heliosastro.png";

  pdfUnlocked = localStorage.getItem("heliosastro_pdf_unlocked") === "1";

  renderChart({
    planets: adaptPlanets(demoPayload.planets),
    aspects: demoPayload.aspects
  });

  registerPWA();
  renderPayPalButtons();
  setStatus("Frontend prêt. Tu peux tester le backend, calculer la carte, payer et exporter le PDF premium.");
});
