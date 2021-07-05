/*
The comment here is a good explanation of how it works https://editor.p5js.org/talkscheap/sketches/ryiB52zP-
A similar example: https://editor.p5js.org/tora/sketches/CYMfn3t-V
*/

//this might explain why the shape of the autocorrelation plot diminishes over time: https://dsp.stackexchange.com/questions/64718/autocorrelation-understanding-reduced-correlation-at-periodic-time-shifts-usin
//kinda sorta similar mathematical model: https://dsp.stackexchange.com/questions/15658/autocorrelation-function-of-a-discrete-signal
//ignoring subtracting the mean (apparently ignored in DSP): https://stats.stackexchange.com/questions/142981/when-and-why-should-one-subtract-the-mean-before-computing-autocorrelation-funct
//pretty sure this is what is used here: https://math.stackexchange.com/questions/452563/the-definition-of-autocorrelation

//this talks about normalization (or lack thereof) https://en.wikipedia.org/wiki/Autocorrelation

//great explanation http://qingkaikong.blogspot.com/2017/01/signal-processing-how-autocorrelation.html

/*
- move through main signal one step at a time
- at each step, 
*/

var wave = []

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
	textSize(24);
	textAlign(CENTER, CENTER);
  textFont('monospace');

  // source = new p5.AudioIn();
  // source.start();

  // lowPass = new p5.LowPass();
  // lowPass.disconnect();
  // source.connect(lowPass);

  // fft = new p5.FFT();
  // fft.setInput(lowPass);
}

function draw() {
  background(255);
  // noFill();

  // array of values from -1 to 1
  // var timeDomain = fft.waveform(1024, 'float32');
  // // var corrBuff = autoCorrelate(timeDomain);
  // var corrBuff = autocorrelate(timeDomain)

  var corrBuff = wave

  strokeWeight(3);
  // stroke(66, 244, 155);

  beginShape();
  for (var i = 0; i < corrBuff.length; i++) {
    var w = map(i, 0, corrBuff.length, 1, width);
    var h = map(corrBuff[i], -1, 1, height, 0);
    curveVertex(w, h);
  }
  endShape();

  // line(0, height/2, width, height/2);
}

function rxx(l, N, x) {
    var sum = 0;
    for (var n = 0; n <= N - l - 1; n++) {
      sum += (x[n] * x [n + l])
    }
    return sum;
  }
  
  //make this a more functional applyLag function that takes rxx as argument?
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

  //not normalizing between -1 and 1 is called covariance: https://math.stackexchange.com/questions/1621786/why-is-autocorrelation-used-without-normalization-in-signal-processing-field
function getFreq (autocorrelation, sampleRate) {
    sum = 0
    pd_state = 0
    period = 0
  
    for (i = 0; i < autocorrelation.length; i++) {
      sum_old = sum
      sum = autocorrelation[i]
  
      // Peak Detect State Machine
      if (pd_state == 2 && sum - sum_old <= 0) {
        //comparing the
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
    console.log("Frequency:")
    console.log(freq)
}


  //http://www.akellyirl.com/reliable-frequency-detection-using-dsp-techniques/
  //https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/
  //https://dsp.stackexchange.com/questions/28318/getting-a-more-accurate-frequency-read-from-autocorrelation-and-peak-detection-a

  //explanation for this code: https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/