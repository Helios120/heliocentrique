document.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("heliosCanvas");
  const ctx = canvas.getContext("2d");

  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;

  const modelImage = new Image();
  let modelLoaded = false;

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

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function clear() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
  }

  function drawModel() {
    clear();
    ctx.drawImage(modelImage, 0, 0, size, size);
  }

  function drawPlanetArc(longitude, color) {
    const r = 520;

    ctx.beginPath();
    ctx.arc(cx, cy, r, degToRad(longitude - 6), degToRad(longitude + 6));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawConnector(longitude, color) {
    const inner = 420;
    const outer = 540;

    const rad = degToRad(longitude);

    const x1 = cx + Math.cos(rad) * inner;
    const y1 = cy + Math.sin(rad) * inner;

    const x2 = cx + Math.cos(rad) * outer;
    const y2 = cy + Math.sin(rad) * outer;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPlanet(longitude, glyph, color, name) {
    const r = 580;
    const rad = degToRad(longitude);

    const x = cx + Math.cos(rad) * r;
    const y = cy + Math.sin(rad) * r;

    // planète glow
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // symbole
    ctx.fillStyle = "#fff";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y);

    // nom
    ctx.font = "18px Arial";
    ctx.fillText(name, x, y + 40);
  }

  function drawChart(planets) {
    drawModel();

    planets.forEach(p => {
      drawPlanetArc(p.longitude, p.color);
      drawConnector(p.longitude, p.color);
    });

    planets.forEach(p => {
      drawPlanet(p.longitude, p.glyph, p.color, p.name);
    });
  }

  function demoPlanets() {
    return [
      { name: "Soleil", glyph: "☉", longitude: 330, color: planetColors["☉"] },
      { name: "Lune", glyph: "☽", longitude: 15, color: planetColors["☽"] },
      { name: "Mercure", glyph: "☿", longitude: 300, color: planetColors["☿"] },
      { name: "Vénus", glyph: "♀", longitude: 280, color: planetColors["♀"] },
      { name: "Mars", glyph: "♂", longitude: 90, color: planetColors["♂"] },
      { name: "Jupiter", glyph: "♃", longitude: 240, color: planetColors["♃"] },
      { name: "Saturne", glyph: "♄", longitude: 160, color: planetColors["♄"] },
      { name: "Uranus", glyph: "♅", longitude: 30, color: planetColors["♅"] },
      { name: "Neptune", glyph: "♆", longitude: 20, color: planetColors["♆"] },
      { name: "Pluton", glyph: "♇", longitude: 305, color: planetColors["♇"] }
    ];
  }

  // INIT

  modelImage.onload = () => {
    modelLoaded = true;
    drawChart(demoPlanets());
  };

  modelImage.onerror = () => {
    alert("Image modèle non trouvée → vérifie assets/helios-modele-principal.png");
  };

  modelImage.src = "assets/helios-modele-principal.png";

});
