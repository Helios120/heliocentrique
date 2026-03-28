document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://heliosastro-backend.onrender.com";

  const nameInput = document.getElementById("expert-name");
  const dateInput = document.getElementById("expert-date");
  const timeInput = document.getElementById("expert-time");
  const cityInput = document.getElementById("expert-city");
  const countryInput = document.getElementById("expert-country");
  const latitudeInput = document.getElementById("expert-latitude");
  const longitudeInput = document.getElementById("expert-longitude");
  const houseSystemInput = document.getElementById("expert-house-system");

  const generateBtn = document.getElementById("generate-btn");
  const demoBtn = document.getElementById("demo-btn");
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");

  const statusBox = document.getElementById("status-box");
  const summaryBox = document.getElementById("summary-box");
  const planetsBox = document.getElementById("planets-box");
  const housesBox = document.getElementById("houses-box");
  const aspectsBox = document.getElementById("aspects-box");
  const interpretationBox = document.getElementById("interpretation-box");
  const privateNotes = document.getElementById("private-notes");

  let currentChart = null;

  const demoChart = {
    meta: {
      date: "2025-06-03",
      time: "22:00",
      city: "Paris",
      country: "France",
      latitude: 48.8566,
      longitude: 2.3522,
      houseSystem: "Placidus"
    },
    ascendant: { longitude: 112.5, sign: "Cancer", degreeInSign: 22.5 },
    mc: { longitude: 12.2, sign: "Bélier", degreeInSign: 12.2 },
    houses: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      longitude: (112.5 + i * 30) % 360,
      sign: ["Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons","Bélier","Taureau","Gémeaux"][i],
      degreeInSign: 22.5
    })),
    planets: [
      { name: "Soleil", glyph: "☉", longitude: 71.8, sign: "Gémeaux", degreeInSign: 11.8 },
      { name: "Lune", glyph: "☽", longitude: 172.26, sign: "Vierge", degreeInSign: 22.26 },
      { name: "Mercure", glyph: "☿", longitude: 251.83, sign: "Sagittaire", degreeInSign: 11.83 },
      { name: "Vénus", glyph: "♀", longitude: 208.33, sign: "Balance", degreeInSign: 28.33 },
      { name: "Mars", glyph: "♂", longitude: 197.30, sign: "Balance", degreeInSign: 17.30 },
      { name: "Jupiter", glyph: "♃", longitude: 289.54, sign: "Capricorne", degreeInSign: 19.54 },
      { name: "Saturne", glyph: "♄", longitude: 217.29, sign: "Scorpion", degreeInSign: 7.29 },
      { name: "Uranus", glyph: "♅", longitude: 352.93, sign: "Poissons", degreeInSign: 22.93 },
      { name: "Neptune", glyph: "♆", longitude: 139.54, sign: "Lion", degreeInSign: 19.54 },
      { name: "Pluton", glyph: "♇", longitude: 330.93, sign: "Poissons", degreeInSign: 0.93 }
    ],
    aspects: [
      { p1: "Vénus", p2: "Mars", aspect: "Conjonction", exactAngle: 11.03, orb: 11.03 },
      { p1: "Soleil", p2: "Mercure", aspect: "Opposition", exactAngle: 180.03, orb: 0.03 }
    ]
  };

  function setStatus(text) {
    statusBox.innerHTML = text;
  }

  function renderSummary(chart) {
    const sun = chart.planets.find(p => p.name === "Soleil");
    const moon = chart.planets.find(p => p.name === "Lune");

    summaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Consultant :</strong> ${nameInput.value || "—"}</div>
        <div class="row"><strong>Soleil :</strong> ${sun.degreeInSign.toFixed(2)}° ${sun.sign}</div>
        <div class="row"><strong>Lune :</strong> ${moon.degreeInSign.toFixed(2)}° ${moon.sign}</div>
        <div class="row"><strong>Ascendant :</strong> ${chart.ascendant.degreeInSign.toFixed(2)}° ${chart.ascendant.sign}</div>
        <div class="row"><strong>MC :</strong> ${chart.mc.degreeInSign.toFixed(2)}° ${chart.mc.sign}</div>
      </div>
    `;
  }

  function renderPlanets(chart) {
    planetsBox.innerHTML = `
      <div class="table-like">
        ${chart.planets.map(p => `
          <div class="row">
            <strong>${p.glyph} ${p.name}</strong><br>
            ${p.degreeInSign.toFixed(2)}° ${p.sign}<br>
            <span class="muted">Longitude : ${p.longitude.toFixed(3)}°</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderHouses(chart) {
    housesBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Ascendant</strong><br>${chart.ascendant.degreeInSign.toFixed(2)}° ${chart.ascendant.sign}</div>
        <div class="row"><strong>MC</strong><br>${chart.mc.degreeInSign.toFixed(2)}° ${chart.mc.sign}</div>
        ${chart.houses.map(h => `
          <div class="row">
            <strong>Maison ${h.house}</strong><br>
            ${h.degreeInSign.toFixed(2)}° ${h.sign}
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderAspects(chart) {
    if (!chart.aspects?.length) {
      aspectsBox.innerHTML = `<div class="row">Aucun aspect majeur retenu.</div>`;
      return;
    }

    aspectsBox.innerHTML = `
      <div class="table-like">
        ${chart.aspects.map(a => `
          <div class="row">
            <strong>${a.p1} – ${a.p2}</strong><br>
            ${a.aspect}<br>
            <span class="muted">Angle : ${a.exactAngle.toFixed(2)}° | Orbe : ${a.orb.toFixed(2)}°</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function buildInterpretation(chart) {
    const sun = chart.planets.find(p => p.name === "Soleil");
    const moon = chart.planets.find(p => p.name === "Lune");
    const mercury = chart.planets.find(p => p.name === "Mercure");
    const venus = chart.planets.find(p => p.name === "Vénus");
    const mars = chart.planets.find(p => p.name === "Mars");

    interpretationBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Identité centrale</strong><br>Soleil en ${sun.sign} : axe principal du thème, manière d’exister et de rayonner.</div>
        <div class="row"><strong>Vie émotionnelle</strong><br>Lune en ${moon.sign} : climat intérieur, sécurité, réaction instinctive.</div>
        <div class="row"><strong>Fonction mentale</strong><br>Mercure en ${mercury.sign} : manière de penser, formuler, analyser.</div>
        <div class="row"><strong>Vie affective</strong><br>Vénus en ${venus.sign} : style relationnel, goûts, harmonisation.</div>
        <div class="row"><strong>Énergie d’action</strong><br>Mars en ${mars.sign} : mode de décision, tension, affirmation.</div>
        <div class="row"><strong>Présentation sociale</strong><br>Ascendant en ${chart.ascendant.sign} : première impression, manière d’entrer dans le monde.</div>
      </div>
    `;
  }

  function renderChart(chart) {
    currentChart = chart;
    renderSummary(chart);
    renderPlanets(chart);
    renderHouses(chart);
    renderAspects(chart);
    buildInterpretation(chart);
  }

  async function generateChart() {
    const payload = {
      date: dateInput.value || "",
      time: timeInput.value || "12:00",
      city: cityInput.value || "Paris",
      country: countryInput.value || "France",
      latitude: Number(latitudeInput.value),
      longitude: Number(longitudeInput.value),
      houseSystem: houseSystemInput.value || "P"
    };

    if (!payload.date) {
      setStatus("Date obligatoire.");
      return;
    }

    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      setStatus("Latitude et longitude obligatoires.");
      return;
    }

    try {
      setStatus("Calcul du thème expert en cours...");

      const response = await fetch(`${API_BASE}/api/expert-chart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error("Le backend renvoie du HTML ou un JSON invalide.");
      }

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Erreur backend");
      }

      renderChart(data);
      setStatus(`Thème expert généré pour ${payload.date} ${payload.time} — ${payload.city}, ${payload.country}.`);
    } catch (error) {
      renderChart(demoChart);
      setStatus(`Démo affichée. Motif : ${error.message}`);
    }
  }

  function saveLocal() {
    const payload = {
      chart: currentChart,
      name: nameInput.value,
      notes: privateNotes.value,
      inputs: {
        date: dateInput.value,
        time: timeInput.value,
        city: cityInput.value,
        country: countryInput.value,
        latitude: latitudeInput.value,
        longitude: longitudeInput.value,
        houseSystem: houseSystemInput.value
      }
    };

    localStorage.setItem("helios_expert_last_chart", JSON.stringify(payload));
    setStatus("Dernier thème sauvegardé localement.");
  }

  function loadLocal() {
    const raw = localStorage.getItem("helios_expert_last_chart");
    if (!raw) {
      setStatus("Aucune sauvegarde locale.");
      return;
    }

    const saved = JSON.parse(raw);

    nameInput.value = saved.name || "";
    privateNotes.value = saved.notes || "";

    if (saved.inputs) {
      dateInput.value = saved.inputs.date || "";
      timeInput.value = saved.inputs.time || "12:00";
      cityInput.value = saved.inputs.city || "";
      countryInput.value = saved.inputs.country || "";
      latitudeInput.value = saved.inputs.latitude || "";
      longitudeInput.value = saved.inputs.longitude || "";
      houseSystemInput.value = saved.inputs.houseSystem || "P";
    }

    if (saved.chart) {
      renderChart(saved.chart);
      setStatus("Dernier thème rechargé.");
    }
  }

  function exportJson() {
    if (!currentChart) {
      setStatus("Aucun thème à exporter.");
      return;
    }

    const blob = new Blob(
      [JSON.stringify({
        consultant: nameInput.value || "",
        notes: privateNotes.value || "",
        chart: currentChart
      }, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(nameInput.value || "theme").replace(/\s+/g, "-").toLowerCase()}-expert.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  generateBtn.addEventListener("click", generateChart);
  demoBtn.addEventListener("click", () => {
    renderChart(demoChart);
    setStatus("Démo expert affichée.");
  });
  saveBtn.addEventListener("click", saveLocal);
  loadBtn.addEventListener("click", loadLocal);
  exportJsonBtn.addEventListener("click", exportJson);

  renderChart(demoChart);
  setStatus("Logiciel expert prêt.");
});
