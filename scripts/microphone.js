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

function autocorrelate (samples) {
  //http://www.akellyirl.com/reliable-frequency-detection-using-dsp-techniques/
  //https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/
  //https://dsp.stackexchange.com/questions/28318/getting-a-more-accurate-frequency-read-from-autocorrelation-and-peak-detection-a

  //explanation for this code: https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/
  autocorrelation = []

  for (var lag = 0; lag < samples.length; lag++) {
    var sum = 0
    for (var index = 0; index < samples.length - lag; index++) {
      var sound1 = samples[index]
      var sound2 = samples[index + lag]
      var product = sound1 * sound2
      sum += product
    }
    autocorrelation[lag] = sum
  }
  /*
  // Autocorrelation
  //every sample gets compared to a lagged ve
  for (var lag = 0; lag < samples.length; lag++) {
    var sum = 0 //we re-calculate the sum for every sample

    //on the first complete pass through this inner loop, every single sample gets multiplied by itself....because lag is zero initially
    //on the second complete pass through this inner loop, lag == 1.  So every single sample gets multipled by the next sample...sample + 1
    //on the third complete pass through this inner loop, lag == 2.  Soe very single sample gets multipled by the next sample....sample + 2

    ///so wait...why is it (samples.length - lag)?
    //on the first complete pass, we look at samples[0] to samples[samples.length]
    //on the second complete pass, we look at samples[0] to samples[samples.length - 1]
    //on the third complete pass, we look at samples[0] to samples[samples.length - 2]
    //on the last pass through this loop, we look at samples[0] and compare it only to samples[0]
    //that matches the gif here, but in reverse, I believe: http://qingkaikong.blogspot.com/2017/01/signal-processing-how-autocorrelation.html
    for (var index = 0; index < samples.length - lag; index++) {
      console.log("lag = " + lag + ", index = " + index)
      console.log(
        'comparing samples[' + index + '] to samples [' + (index + lag) + ']'
      )
      var sound1 = samples[index]
      var sound2 = samples[index + lag] //if we didn't subtract the lag above, we would go out of bounds here
      var product = sound1 * sound2
      sum += product
    }
    autocorrelation[lag] = sum
  }
        */

  return autocorrelation
}


function normalize(buffer) {
  var biggestVal = 0;
  var nSamples = buffer.length;
  for (var index = 0; index < nSamples; index++){
    if (abs(buffer[index]) > biggestVal){
      biggestVal = abs(buffer[index]);
    }
  }
  for (var index = 0; index < nSamples; index++){

    // divide each sample of the buffer by the biggest val
    buffer[index] /= biggestVal;
  }
  return buffer;
}

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

function Microphone (_fft) {
  var FFT_SIZE = 4096
  this.spectrum = []
  this.volume = this.vol = 0
  this.peak_volume = 0
  var self = this
  var audioContext = new AudioContext({ sampleRate: 48000 / 2 / 2 })
  // var audioContext = new AudioContext()
  var SAMPLE_RATE = audioContext.sampleRate

  // this is just a browser check to see
  // if it supports AudioContext and getUserMedia
  window.AudioContext = window.AudioContext || window.webkitAudioContext
  navigator.getUserMedia =
    navigator.getUserMedia || navigator.webkitGetUserMedia

  // now just wait until the microphone is fired up
  // window.addEventListener('load', init, false);

  //document.body.addEventListener('click', init) //I had to add this line instead - JAG


  this.init = function () {
    try {
      startMic(new AudioContext())
    } catch (e) {
      console.error(e)
      alert('Web Audio API is not supported in this browser')
    }
  }

  function startMic (context) {
    navigator.getUserMedia({ audio: true }, processSound, error)
    function processSound (stream) {

      // analyser extracts frequency, waveform, etc.
      var analyser = context.createAnalyser()
      analyser.smoothingTimeConstant = 0.2
      analyser.fftSize = FFT_SIZE
      //   var node = context.createScriptProcessor(FFT_SIZE * 2, 1, 1) //JAG - I'm not sure why he put FFT_SIZE * 2?
      var node = context.createScriptProcessor(FFT_SIZE, 1, 1)
      node.onaudioprocess = function () {
        self.spectrum = new Float32Array(4096)
        analyser.getFloatTimeDomainData(self.spectrum)

        var ac = autocorrelate(self.spectrum)
        var freq = getFreq(ac, context.sampleRate)
        console.log(freq)
        wave = normalize(ac); //looks like it has to be normalized to visualize properly
        // wave = ac /
        // console.log(ac)
      }
      var input = context.createMediaStreamSource(stream)
      input.connect(analyser)
      analyser.connect(node)
      node.connect(context.destination)
    }
    function error () {
      console.log(arguments)
    }
  }

  return this
}

document.body.addEventListener('click', function () {
  var Mic = new Microphone(1024 * 16)

  Mic.init()
})
