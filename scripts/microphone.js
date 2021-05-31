/*
The comment here is a good explanation of how it works https://editor.p5js.org/talkscheap/sketches/ryiB52zP-
*/

//this talks about normalization (or lack thereof) https://en.wikipedia.org/wiki/Autocorrelation

//great explanation http://qingkaikong.blogspot.com/2017/01/signal-processing-how-autocorrelation.html
function autocorrelate (samples, sampleRate) {
  //http://www.akellyirl.com/reliable-frequency-detection-using-dsp-techniques/
  //https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/
  //https://dsp.stackexchange.com/questions/28318/getting-a-more-accurate-frequency-read-from-autocorrelation-and-peak-detection-a

  //explanation for this code: https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/
  autocorrelation = []

  // Autocorrelation
  for (var lag = 0; lag < samples.length; lag++) {
    var sum = 0 //we re-calculate the sum for every sample

    for (var index = 0; index < samples.length - lag; index++) {
      var sound1 = samples[index]
      var sound2 = samples[index + lag]
      var product = sound1 * sound2
      sum += product
    }

    autocorrelation[lag] = sum
  }

  return autocorrelation
}

function getFreq(autocorrelation, sampleRate) {

  sum = 0
  pd_state = 0
  period = 0

  for (i = 0; i < autocorrelation.length; i++) {
    sum_old = sum
    sum = autocorrelation[i]

    // Peak Detect State Machine
    if (pd_state == 2 && sum - sum_old <= 0) { //comparing the 
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
        var ac = autocorrelate(self.spectrum, context.sampleRate)
        var freq = getFreq(ac, context.sampleRate)
        console.log(freq)
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