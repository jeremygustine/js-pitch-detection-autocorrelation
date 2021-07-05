/*
Example: https://editor.p5js.org/talkscheap/sketches/ryiB52zP-
Example: https://editor.p5js.org/tora/sketches/CYMfn3t-V
Based on work by Jason Sigal and Golan Levin
*/



function setup() {
    createCanvas(windowWidth, windowHeight);
    noFill();
    textSize(24);
	textAlign(CENTER, CENTER);
    textFont('monospace');
}

function draw() {
  background(255);
  strokeWeight(3);

  var corrBuff = wave

  beginShape();
  for (var i = 0; i < corrBuff.length; i++) {
    var w = map(i, 0, corrBuff.length, 1, width);
    var h = map(corrBuff[i], -1, 1, height, 0);
    curveVertex(w, h);
  }
  endShape();
}
