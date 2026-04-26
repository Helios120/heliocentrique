const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W, H, CX, CY, R;

function resize(){
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    CX = W/2;
    CY = H/2;
    R = Math.min(W,H)*0.42;
}
window.addEventListener("resize", resize);
resize();

function drawBase(){
    ctx.clearRect(0,0,W,H);

    // cercle principal
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // divisions zodiac 12
    for(let i=0;i<12;i++){
        let a = (i/12)*Math.PI*2 - Math.PI/2;

        let x1 = CX + Math.cos(a)*(R-10);
        let y1 = CY + Math.sin(a)*(R-10);

        let x2 = CX + Math.cos(a)*R;
        let y2 = CY + Math.sin(a)*R;

        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.strokeStyle="rgba(255,255,255,0.3)";
        ctx.stroke();
    }
}

function drawArcs(){
    let colors = [
        "#00eaff","#00ffcc","#00ff66","#aaff00",
        "#ffff00","#ffcc00","#ff9900","#ff5500",
        "#ff0055","#ff00aa","#aa00ff","#5500ff"
    ];

    for(let i=0;i<12;i++){

        let angle = (i/12)*Math.PI*2 - Math.PI/2;

        ctx.beginPath();

        let steps = 80;

        for(let j=0;j<steps;j++){

            let t = j/steps;

            let r = R * t;

            let a = angle + Math.sin(t*4 + i)*0.15;

            let x = CX + Math.cos(a)*r;
            let y = CY + Math.sin(a)*r;

            if(j===0) ctx.moveTo(x,y);
            else ctx.lineTo(x,y);
        }

        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function drawCenter(){
    let g = ctx.createRadialGradient(CX,CY,0,CX,CY,40);
    g.addColorStop(0,"rgba(255,255,255,1)");
    g.addColorStop(1,"rgba(0,0,0,0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(CX,CY,40,0,Math.PI*2);
    ctx.fill();
}

function draw(){

    drawBase();
    drawArcs();
    drawCenter();

}

draw();
