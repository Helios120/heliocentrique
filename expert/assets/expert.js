const canvas = document.getElementById("expert-canvas");
const ctx = canvas.getContext("2d");

const SIZE = 1600;
canvas.width = SIZE;
canvas.height = SIZE;

const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE * 0.42;

// 🔥 PLANETES DEMO
const PLANETS = [
  { name: "Soleil", deg: 70, color: "#f5c542" },
  { name: "Lune", deg: 180, color: "#ffffff" },
  { name: "Mars", deg: 200, color: "#ff5733" },
  { name: "Vénus", deg: 210, color: "#ff8fdc" },
  { name: "Saturne", deg: 220, color: "#00c2ff" },
  { name: "Neptune", deg: 130, color: "#00e5ff" },
  { name: "Uranus", deg: 350, color: "#7fff00" },
  { name: "Pluton", deg: 330, color: "#b388ff" },
];

// 🔥 MAISONS SIMPLES (12 divisions égales)
const houses = [];
for (let i = 0; i < 12; i++) {
  houses.push(i * 30);
}

// 🔥 ASCENDANT (simulation Marseille)
const ASC = 200;
const MC = 100;

// ========================
// DRAW
// ========================
function drawChart() {
  ctx.clearRect(0, 0, SIZE, SIZE);

  drawBackground();
  drawCircle();
  drawZodiac();
  drawHouses();
  drawPlanets();
  drawAngles();
}

// ========================
// BACKGROUND
// ========================
function drawBackground() {
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
  g.addColorStop(0, "#0ff");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, R * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

// ========================
// CERCLE PARFAIT
// ========================
function drawCircle() {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.stroke();
}

// ========================
// ZODIAQUE
// ========================
function drawZodiac() {
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";

  for (let i = 0; i < 12; i++) {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    const x = CX + Math.cos(angle) * (R - 40);
    const y = CY + Math.sin(angle) * (R - 40);

    ctx.fillText(i + 1, x - 10, y + 10);
  }
}

// ========================
// MAISONS
// ========================
function drawHouses() {
  ctx.strokeStyle = "#ffffff44";

  houses.forEach((deg) => {
    const angle = ((deg - 90) * Math.PI) / 180;

    const x = CX + Math.cos(angle) * R;
    const y = CY + Math.sin(angle) * R;

    ctx.beginPath();
    ctx.moveTo(CX, CY); // 🔥 PART DU CENTRE
    ctx.lineTo(x, y);
    ctx.stroke();
  });
}

// ========================
// PLANETES (ARCS CENTRE OK)
// ========================
function drawPlanets() {
  PLANETS.forEach((p) => {
    const angle = ((p.deg - 90) * Math.PI) / 180;

    const x = CX + Math.cos(angle) * R;
    const y = CY + Math.sin(angle) * R;

    // 🔥 ARC DEPUIS CENTRE
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(CX, CY); // 🔥 CENTRE
    ctx.quadraticCurveTo(
      CX + Math.cos(angle) * (R * 0.4),
      CY + Math.sin(angle) * (R * 0.4),
      x,
      y
    );
    ctx.stroke();

    // planète
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ========================
// ASC + MC
// ========================
function drawAngles() {
  drawAngle(ASC, "ASC", "#ff8800");
  drawAngle(MC, "MC", "#00ffff");
}

function drawAngle(deg, label, color) {
  const angle = ((deg - 90) * Math.PI) / 180;

  const x = CX + Math.cos(angle) * R;
  const y = CY + Math.sin(angle) * R;

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(CX, CY); // 🔥 CENTRE
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = "20px Arial";
  ctx.fillText(label, x + 10, y);
}

// ========================
drawChart();
