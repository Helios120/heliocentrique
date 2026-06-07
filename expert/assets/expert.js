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
let animationTime = 0;
let animationId = null;

function resizeCanvas() {
  const parent = canvas.parentElement;
  const box = parent.getBoundingClientRect();

  const isMobile = window.innerWidth <= 700;

  let size;

  if (isMobile) {
    size = Math.min(window.innerWidth * 0.92, 420);
  } else {
    size = Math.max(520, Math.min(box.width, box.height || box.width, 940));
  }

  canvas.width = size;
  canvas.height = size;

  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";

  W = size;
  H = size;
  CX = W / 2;
  CY = H / 2;

  if (isMobile) {
    R = size * 0.34;
  } else {
    R = size * 0.415;
  }
}

function degToRad(deg) {
  return (deg - 90) * Math.PI / 180;
}

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function pointFromDeg(deg, radius) {
  const a = degToRad(deg);
  return {
    x: CX + Math.cos(a) * radius,
    y: CY + Math.sin(a) * radius
  };
}

function clearCanvas() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
}

function drawBackgroundGlow() {
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 1.35);
  g.addColorStop(0, "rgba(255,255,255,0.18)");
  g.addColorStop(0.18, "rgba(69,221,255,0.12)");
  g.addColorStop(0.45, "rgba(35,90,255,0.055)");
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, R * 1.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawOuterWheel() {
  const outer = R;
  const zodiacInner = R * 0.78;
  const degreeRing = R * 0.91;

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, outer, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CX, CY, zodiacInner, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(CX, CY, degreeRing, 0, Math.PI * 2);
  ctx.stroke();

  for (let d = 0; d < 360; d += 10) {
    const p1 = pointFromDeg(d, outer);
    const p2 = pointFromDeg(d, d % 30 === 0 ? outer - 26 : outer - 13);

    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = d % 30 === 0 ? 2.2 : 1;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const txt = pointFromDeg(d, outer - 45);
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = `${Math.max(9, R * 0.029)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(d), txt.x, txt.y);
  }
}

function drawZodiac() {
  const signs = [
    ["♈", 0], ["♉", 30], ["♊", 60], ["♋", 90],
    ["♌", 120], ["♍", 150], ["♎", 180], ["♏", 210],
    ["♐", 240], ["♑", 270], ["♒", 300], ["♓", 330]
  ];

  signs.forEach(([glyph, start]) => {
    const p1 = pointFromDeg(start, R);
    const p2 = pointFromDeg(start, R * 0.78);

    ctx.strokeStyle = "rgba(255,255,255,0.66)";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const glyphPoint = pointFromDeg(start + 15, R * 0.84);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(24, R * 0.075)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, glyphPoint.x, glyphPoint.y);
  });
}

function drawHouses() {
  const ascDeg = 201;
  const mcDeg = 110;

  for (let i = 0; i < 12; i++) {
    const deg = normalizeDeg(ascDeg + i * 30);

    const p1 = pointFromDeg(deg, R * 0.18);
    const p2 = pointFromDeg(deg, R * 0.735);

    ctx.strokeStyle = i === 0 ? "rgba(255,211,105,0.98)" : "rgba(90,220,255,0.44)";
    ctx.lineWidth = i === 0 ? 3 : 1.45;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const numPoint = pointFromDeg(deg + 15, R * 0.48);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = `bold ${Math.max(13, R * 0.042)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), numPoint.x, numPoint.y);
  }

  const asc = pointFromDeg(ascDeg, R * 1.055);
  ctx.fillStyle = "#ffd369";
  ctx.font = `bold ${Math.max(18, R * 0.052)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ASC", asc.x, asc.y);

  const mc = pointFromDeg(mcDeg, R * 1.055);
  ctx.fillStyle = "#45ddff";
  ctx.fillText("MC", mc.x, mc.y);
}

function drawMathematicalArc(deg, color, curvature, phase) {
  const steps = 140;
  const target = degToRad(deg);

  ctx.beginPath();
  ctx.moveTo(CX, CY);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const radial = R * 0.965 * t;
    const easing = Math.sin(t * Math.PI);
    const spiral = Math.pow(t, 1.35) * 0.035 * Math.sin(animationTime * 0.9 + phase);
    const curve = easing * curvature;

    const a = target + curve + spiral;

    const x = CX + Math.cos(a) * radial;
    const y = CY + Math.sin(a) * radial;

    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2.4, R * 0.007);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPlanets() {
  const planets = [
    { name: "Soleil", glyph: "☉", deg: 71.8, color: "#ffb300", c: 0.10 },
    { name: "Lune", glyph: "☽", deg: 172.2, color: "#fff2cc", c: -0.07 },
    { name: "Mercure", glyph: "☿", deg: 251.8, color: "#ff9c3a", c: 0.13 },
    { name: "Vénus", glyph: "♀", deg: 208.3, color: "#ff6ec7", c: -0.12 },
    { name: "Mars", glyph: "♂", deg: 197.3, color: "#ff4d4d", c: 0.09 },
    { name: "Jupiter", glyph: "♃", deg: 289.5, color: "#9bb8ff", c: -0.11 },
    { name: "Saturne", glyph: "♄", deg: 217.2, color: "#00c3ff", c: 0.14 },
    { name: "Uranus", glyph: "♅", deg: 352.9, color: "#7dff66", c: -0.08 },
    { name: "Neptune", glyph: "♆", deg: 139.5, color: "#00e1ff", c: 0.12 },
    { name: "Pluton", glyph: "♇", deg: 300.1, color: "#c66bff", c: -0.14 }
  ];

  planets.forEach((p, i) => {
    drawMathematicalArc(p.deg, p.color, p.c, i * 0.71);

    const pos = pointFromDeg(p.deg, R * 1.075);

    ctx.fillStyle = p.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(10, R * 0.034), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(13, R * 0.038)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.glyph, pos.x, pos.y);

    const label = pointFromDeg(p.deg, R * 1.17);
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.font = `bold ${Math.max(10, R * 0.029)}px Arial`;
    ctx.fillText(p.name, label.x, label.y);
  });
}

function drawDynamicVortex() {
  const arms = 9;
  const turns = 3.4;

  ctx.save();

  for (let a = 0; a < arms; a++) {
    ctx.beginPath();

    for (let i = 0; i <= 190; i++) {
      const t = i / 190;
      const angle =
        a * Math.PI * 2 / arms +
        t * Math.PI * 2 * turns +
        animationTime * 0.018;

      const radius = R * 0.235 * Math.pow(t, 0.78);
      const pulse = 1 + 0.045 * Math.sin(animationTime * 0.05 + i * 0.09 + a);

      const x = CX + Math.cos(angle) * radius * pulse;
      const y = CY + Math.sin(angle) * radius * pulse;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const hue = 185 + a * 17;
    ctx.strokeStyle = `hsla(${hue}, 100%, 68%, 0.34)`;
    ctx.lineWidth = Math.max(0.8, R * 0.003);
    ctx.shadowBlur = 12;
    ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.65)`;
    ctx.stroke();
  }

  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.23);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.16, "rgba(255,240,170,0.95)");
  g.addColorStop(0.36, "rgba(69,221,255,0.56)");
  g.addColorStop(0.72, "rgba(50,110,255,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, R * 0.23, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawPrecision360() {
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;

  for (let d = 0; d < 360; d++) {
    const p1 = pointFromDeg(d, R * 0.985);
    const p2 = pointFromDeg(d, d % 5 === 0 ? R * 0.965 : R * 0.975);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function drawChart() {
  clearCanvas();
  drawBackgroundGlow();
  drawHouses();
  drawOuterWheel();
  drawPrecision360();
  drawZodiac();
  drawPlanets();
  drawDynamicVortex();
}

function renderAll() {
  resizeCanvas();
  drawChart();
}

function animate() {
  animationTime += 1;
  drawChart();
  animationId = requestAnimationFrame(animate);
}

window.addEventListener("resize", renderAll);

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

resizeCanvas();

if (animationId) {
  cancelAnimationFrame(animationId);
}

animate();
