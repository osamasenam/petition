let sig = $('#signature');

const can1 = $('#canv');
const can = $('#canv').get(0);
const ctx = can.getContext('2d');
    
// let sig;

can1.on("mousedown", function(e) {
    console.log("mousemove running");
    // updating position
    currentX = e.clientX;
    currentY = e.clientY;
    can1.on("mousemove", draw);
});

can1.on("mouseup", function () {
    console.log("stop drawing");
    can1.off("mousemove", draw);
    sig.val(can.toDataURL());
    // console.log(sig);
});

function draw (e) {
    console.log("drawing now");
    
    ctx.beginPath(); 
    ctx.moveTo(currentX - can.getBoundingClientRect().left, currentY - can.getBoundingClientRect().top);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'blue';
    // why the default 'butt' does not draw anything?!
    // ctx.lineCap = 'round'; // it allows drawing points
    
    // updating position
    currentX = e.clientX;
    currentY = e.clientY;
    
    // the drawing coordinates are relative to the canvas element
    ctx.lineTo(currentX - can.getBoundingClientRect().left, currentY - can.getBoundingClientRect().top); 

    ctx.stroke(); // draw it!

    
}

// $(document).on("keydown", function() {
//     console.log("clear");
//     //clear the screen
//     ctx.clearRect(0, 0, can.width, can.height); 
//     sigImg = new Image();
//     sigImg.src = sig;
//     document.body.appendChild(sigImg);

// });