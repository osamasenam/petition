var can = $('#canv');
var ctx = can.get(0).getContext('2d');
    
let sig;

can.on("mousedown", function() {
    console.log("mousemove running");
    can.on("mousemove", draw);
});

can.on("mouseup", function () {
    console.log("stop drawing");
    can.off("mousemove", draw);
    sig = can.get(0).toDataURL();
    // console.log(sig);
});

function draw (e) {
  
    currentX = e.clientX;
    currentY = e.clientY;
    console.log("currentX", currentX);
    console.log("currentY", currentY);

    ctx.beginPath(); 

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'blue';
    // why the default 'butt' does not draw anything?!
    ctx.lineCap = 'round';

    ctx.lineTo(currentX, currentY); 

    ctx.stroke(); // draw it!

    
}

$(document).on("keydown", function() {
    console.log("clear");
    //clear the screen
    ctx.clearRect(0, 0, can.get(0).width, can.get(0).height); 
    sigImg = new Image();
    sigImg.src = sig;
    document.body.appendChild(sigImg);

});