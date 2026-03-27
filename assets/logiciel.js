const API = "https://heliosastro-backend.onrender.com/ephemerides";

const signs = [
  "♈","♉","♊","♋","♌","♍",
  "♎","♏","♐","♑","♒","♓"
];

// Conversion degré → angle canvas
function degToRad(deg) {
  return (deg - 90) * Math.PI / 180;
}

// Détermine signe
function getSign(deg) {
  return Math.floor(deg / 30);
}

// Dessin maisons
function drawHouses(ctx, cx, cy, radius, houses) {
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;

  houses.forEach(deg => {
    const angle = degToRad(deg);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
}

// Ascendant highlight
function drawAscendant(ctx, cx, cy, radius, asc) {
  const angle = degToRad(asc);

  ctx.strokeStyle = "#00eaff";
  ctx.lineWidth = 3;

  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = "#00eaff";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

// Planètes extérieures
function drawPlanets(ctx, cx, cy, radius, planets) {
  Object.entries(planets).forEach(([name, deg]) => {

    const angle = degToRad(deg);
    const r = radius + 30;

    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // ligne vers centre
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
}

// DRAW GLOBAL
function drawChart(data) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = 180;

  // Cercle
  ctx.strokeStyle = "#00eaff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  drawHouses(ctx, cx, cy, radius, data.houses);
  drawAscendant(ctx, cx, cy, radius, data.ascendant);
  drawPlanets(ctx, cx, cy, radius, data.planets);
}

// FETCH DATA
async function loadChart() {
  const date = document.getElementById("date").value;
  const lat = document.getElementById("lat").value;
  const lon = document.getElementById("lon").value;

  const res = await fetch(`${API}?date=${date}&lat=${lat}&lon=${lon}`);
  const data = await res.json();

  drawChart(data);
}
