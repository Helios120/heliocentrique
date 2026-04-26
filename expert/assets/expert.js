const canvas = document.getElementById("expert-canvas");

if (!canvas) {
  alert("Erreur : canvas expert-canvas introuvable dans expert/index.html");
  throw new Error("Canvas expert-canvas introuvable");
}

const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let CX = 0;
let CY = 0;
let R = 0;

function resizeCanvas() {
  const parent = canvas.parentElement;
  const box = parent.getBoundingClientRect();
  const size = Math.max(420, Math.min(box.width, 900));

  canvas.width = size;
  canvas.height = size;

  W = canvas.width;
  H = canvas.height;
  CX = W / 2;
  CY = H / 2;
  R = Math.min(W, H) * 0.42;
}

function degToRad(deg) {
  return (deg - 90) * Math.PI / 180;
}

function pointFromDeg(deg, radius) {
  const a = degToRad(deg);
  return {
    x: CX + Math.cos(a) * radius,
    y: CY + Math.sin(a) * radius
  };
}

function clearCanvas() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
}

function drawBackgroundGlow() {
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 1.25);
  g.addColorStop(0, "rgba(255,255,255,0.16)");
  g.addColorStop(0.25, "rgba(0,220,255,0.10)");
  g.addColorStop(0.65, "rgba(0,80,255,0.05)");
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, R * 1.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawOuterWheel() {
  const outer = R;
  const inner = R * 0.78;
  const degreeRing = R * 0.91;

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, outer, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.70)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CX, CY, inner, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(CX, CY, degreeRing, 0, Math.PI * 2);
  ctx.stroke();

  for (let d = 0; d < 360; d += 10) {
    const p1 = pointFromDeg(d, outer);
    const p2 = pointFromDeg(d, d % 30 === 0 ? outer - 24 : outer - 12);

    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = d % 30 === 0 ? 2.2 : 1;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    if (d % 10 === 0) {
      const txt = pointFromDeg(d, outer - 42);
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = `${Math.max(9, R * 0.032)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(d), txt.x, txt.y);
    }
  }
}

function drawZodiac() {
  const signs = [
    ["♈", 0], ["♉", 30], ["♊", 60], ["♋", 90],
    ["♌", 120], ["♍", 150], ["♎", 180], ["♏", 210],
    ["♐", 240], ["♑", 270], ["♒", 300], ["♓", 330]
  ];

  for (let i = 0; i < signs.length; i++) {
    const start = signs[i][1];
    const mid = start + 15;

    const p1 = pointFromDeg(start, R);
    const p2 = pointFromDeg(start, R * 0.78);

    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const glyphPoint = pointFromDeg(mid, R * 0.84);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(24, R * 0.08)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(signs[i][0], glyphPoint.x, glyphPoint.y);
  }
}

function drawHouses() {
  const ascDeg = 201;
  const mcDeg = 110;

  for (let i = 0; i < 12; i++) {
    const deg = (ascDeg + i * 30) % 360;

    const p1 = pointFromDeg(deg, R * 0.20);
    const p2 = pointFromDeg(deg, R * 0.73);

    ctx.strokeStyle = i === 0 ? "rgba(255,211,105,0.95)" : "rgba(120,230,255,0.45)";
    ctx.lineWidth = i === 0 ? 3 : 1.4;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const numPoint = pointFromDeg(deg + 15, R * 0.47);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `bold ${Math.max(13, R * 0.045)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), numPoint.x, numPoint.y);
  }

  const asc = pointFromDeg(ascDeg, R * 1.04);
  ctx.fillStyle = "#ffd369";
  ctx.font = `bold ${Math.max(18, R * 0.055)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ASC", asc.x, asc.y);

  const mc = pointFromDeg(mcDeg, R * 1.04);
  ctx.fillStyle = "#45ddff";
  ctx.fillText("MC", mc.x, mc.y);
}

function drawArcFromCenter(deg, color, offset) {
  const steps = 90;
  const base = degToRad(deg);

  ctx.beginPath();
  ctx.moveTo(CX, CY);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const radius = R * 0.92 * t;
    const curve = Math.sin(t * Math.PI) * 0.16 * offset;
    const a = base + curve;

    const x = CX + Math.cos(a) * radius;
    const y = CY + Math.sin(a) * radius;

    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPlanets() {
  const planets = [
    { name: "Soleil", glyph: "☉", deg: 71.8, color: "#ffb300" },
    { name: "Lune", glyph: "☽", deg: 172.2, color: "#fff2cc" },
    { name: "Mercure", glyph: "☿", deg: 251.8, color: "#ff9c3a" },
    { name: "Vénus", glyph: "♀", deg: 208.3, color: "#ff6ec7" },
    { name: "Mars", glyph: "♂", deg: 197.3, color: "#ff4d4d" },
    { name: "Jupiter", glyph: "♃", deg: 289.5, color: "#9bb8ff" },
    { name: "Saturne", glyph: "♄", deg: 217.2, color: "#00c3ff" },
    { name: "Uranus", glyph: "♅", deg: 352.9, color: "#7dff66" },
    { name: "Neptune", glyph: "♆", deg: 139.5, color: "#00e1ff" },
    { name: "Pluton", glyph: "♇", deg: 300.1, color: "#c66bff" }
  ];

  planets.forEach((p, i) => {
    drawArcFromCenter(p.deg, p.color, i % 2 === 0 ? 1 : -1);

    const pos = pointFromDeg(p.deg, R * 1.07);

    ctx.fillStyle = p.color;
    ctx.shadowBlur = 16;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(10, R * 0.035), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(13, R * 0.04)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.glyph, pos.x, pos.y);

    const label = pointFromDeg(p.deg, R * 1.17);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `bold ${Math.max(10, R * 0.03)}px Arial`;
    ctx.fillText(p.name, label.x, label.y);
  });
}

function drawCenter() {
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.20);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,230,130,0.65)");
  g.addColorStop(0.75, "rgba(69,221,255,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, R * 0.20, 0, Math.PI * 2);
  ctx.fill();
}

function drawChart() {
  clearCanvas();
  drawBackgroundGlow();
  drawHouses();
  drawOuterWheel();
  drawZodiac();
  drawPlanets();
  drawCenter();
}

function renderAll() {
  resizeCanvas();
  drawChart();
}

window.addEventListener("resize", renderAll);

document.addEventListener("DOMContentLoaded", renderAll);

renderAll();

const generateBtn = document.getElementById("generate-btn");
const demoBtn = document.getElementById("demo-btn");
const exportPdfBtn = document.getElementById("export-pdf-btn");

if (generateBtn) {
  generateBtn.addEventListener("click", renderAll);
}

if (demoBtn) {
  demoBtn.addEventListener("click", renderAll);
}

if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", function () {
    window.print();
  });
}
