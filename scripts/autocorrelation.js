//http://www.akellyirl.com/reliable-frequency-detection-using-dsp-techniques/
//https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/
//https://dsp.stackexchange.com/questions/28318/getting-a-more-accurate-frequency-read-from-autocorrelation-and-peak-detection-a

//explanation for this code: https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/

/*
The comment here is a good explanation of how it works https://editor.p5js.org/talkscheap/sketches/ryiB52zP-
A similar example: https://editor.p5js.org/tora/sketches/CYMfn3t-V
*/

var wave = []

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

function rxx(l, N, x) {
    var sum = 0;
    for (var n = 0; n <= N - l - 1; n++) {
        sum += (x[n] * x [n + l])
    }
    return sum;
  }
  
function autocorrelationWithShiftingLag(samples) {
    var autocorrelation = []
    for (var lag = 0; lag < samples.length; lag++) {
        autocorrelation[lag] = rxx(lag, samples.length, samples)
    }
    return autocorrelation
}
  
function maxAbsoluteScaling(data) {
    var xMax = Math.abs(Math.max(...data))
    return data.map(x => x / xMax)
}

//peak detection
function getFreq (autocorrelation, sampleRate) {
    sum = 0
    pd_state = 0
    period = 0
  
    for (i = 0; i < autocorrelation.length; i++) {
      sum_old = sum
      sum = autocorrelation[i]
  
      if (pd_state == 2 && sum - sum_old <= 0) {
        period = i
        pd_state = 3
      }
      if (pd_state == 1 && sum > thresh && sum - sum_old > 0) {
        pd_state = 2
      }
      if (!i) {
        thresh = sum * 0.5
        pd_state = 1
      }
    }
  
    frequency = sampleRate / period
    return frequency
  }

function interpret(timeDomainData, sampleRate) {
    var ac = autocorrelationWithShiftingLag(timeDomainData)
    wave = maxAbsoluteScaling(ac)
    var freq = getFreq(wave, sampleRate)
    
    var fundamental_frequency = getFundamentalFrequency(freq)
    var closest_note = getClosestNoteFrequency(fundamental_frequency)
    var note_letter = getNoteLetter(closest_note)
    
    console.log("Frequency: " + freq)
    console.log('estimated fundamental frequency' + fundamental_frequency)
    console.log('estimated closest note' + closest_note)
    console.log('estimated note: ' + note_letter)
}