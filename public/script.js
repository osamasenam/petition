let sig = $('#signature');

const can1 = $('#canv');
const can = $('#canv').get(0);
const ctx = can.getContext('2d');
    
// let sig;

can1.on("mousedown", function() {
    console.log("mousemove running");
    can1.on("mousemove", draw);
});

can1.on("mouseup", function () {
    console.log("stop drawing");
    can1.off("mousemove", draw);
    sig.val(can.toDataURL());
    // console.log(sig);
});

function draw (e) {
  
    currentX = e.clientX;
    currentY = e.clientY;
    
    ctx.beginPath(); 

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'blue';
    // why the default 'butt' does not draw anything?!
    ctx.lineCap = 'round';

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