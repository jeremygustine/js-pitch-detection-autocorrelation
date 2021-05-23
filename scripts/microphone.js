function autocorrelate2 (values, sampleRate) {
  //http://www.akellyirl.com/reliable-frequency-detection-using-dsp-techniques/
  //https://www.instructables.com/Reliable-Frequency-Detection-Using-DSP-Techniques/
  //https://dsp.stackexchange.com/questions/28318/getting-a-more-accurate-frequency-read-from-autocorrelation-and-peak-detection-a
  realFreq = sampleRate
  samples = values.length
  sum = 0
  pd_state = 0
  period = 0
  // Autocorrelation
  for (i = 0; i < samples; i++) {
    sum_old = sum
    sum = 0

    for (k = 0; k < samples - i; k++) sum += values[k] * values[k + i]

    // Peak Detect State Machine
    if (pd_state == 2 && sum - sum_old <= 0) {
      period = i
      pd_state = 3
    }
    if (pd_state == 1 && sum > thresh && sum - sum_old > 0) pd_state = 2
    if (!i) {
      thresh = sum * 0.5
      pd_state = 1
    }
  }
  // Frequency identified in Hz
  freq_per = realFreq / period
  console.log(freq_per)
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
        // bitcount returns array which is half the FFT_SIZE
        // self.spectrum = new Uint8Array(analyser.frequencyBinCount)
        self.spectrum = new Float32Array(4096)
        // getByteFrequencyData returns amplitude for each bin
        //   analyser.getByteFrequencyData(self.spectrum)
        // getByteTimeDomainData gets volumes over the sample time
        // analyser.getByteTimeDomainData(self.spectrum);

        // var freq = doSomeCoolShit(analyser, context)
        // console.log(freq)

        analyser.getFloatTimeDomainData(self.spectrum)
        var ac = autocorrelate2(self.spectrum, context.sampleRate)
        console.log(ac)
        //JAG - I want to log out which frequency bin had the spike
        //   interpret(self.spectrum, SAMPLE_RATE, FFT_SIZE)

        self.vol = self.getRMS(self.spectrum)
        // get peak - a hack when our volumes are low
        if (self.vol > self.peak_volume) self.peak_volume = self.vol
        self.volume = self.vol
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

  this.getRMS = function (spectrum) {
    var rms = 0
    for (var i = 0; i < spectrum.length; i++) {
      rms += spectrum[i] * spectrum[i]
    }
    rms /= spectrum.length
    rms = Math.sqrt(rms)
    return rms
  }

  function map (value, min1, max1, min2, max2) {
    var returnvalue = ((value - min1) / (max1 - min1)) * (max2 - min2) + min2
    return returnvalue
  }

  this.mapSound = function (_me, _total, _min, _max) {
    if (self.spectrum.length > 0) {
      // map to defaults if no values given
      var min = _min || 0
      var max = _max || 100
      //actual new freq
      var new_freq = Math.floor((_me * self.spectrum.length) / _total)
      // map the volumes to a useful number
      return map(self.spectrum[new_freq], 0, self.peak_volume, min, max)
    } else {
      return 0
    }
  }
  //////// SOUND UTILITIES  ////////
  ///// ..... we going to put more stuff here....
  return this
}

function rgb (r, g, b) {
  if (g == undefined) g = r
  if (b == undefined) b = r
  return (
    'rgb(' +
    clamp(Math.round(r), 0, 255) +
    ', ' +
    clamp(Math.round(g), 0, 255) +
    ', ' +
    clamp(Math.round(b), 0, 255) +
    ')'
  )
}

function clamp (value, min, max) {
  return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))
}

function interpretData () {}

document.body.addEventListener('click', function () {
  var Mic = new Microphone(1024 * 16)

  Mic.init()
})

//https://stackoverflow.com/questions/30013898/what-is-the-range-of-the-values-returned-by-analyser-getbytefrequencydata-in-the
//https://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to/14789992#14789992
/*
  According to the above links, the output of getByteFrequencyData is half the length of the FFT_SIZE
  
  each bin refers to freqs:
  N * (samplerate/fft_size)
  
  
  So on chrome:
  bin_width = (48000/1024) = 46.875
  N * (bin_width)
  
  46.875 is WAY too big for a guitar tuner
  
  
  =========================================
  
  //https://electronics.stackexchange.com/questions/12407/what-is-the-relation-between-fft-length-and-frequency-resolution
  
  number of bins = number of samples / 2 (aka fft_size / 2)
  
  "We can see from the above that to get smaller FFT bins we can either run a longer FFT (that is, 
  take more samples at the same rate before running the FFT) or decrease our sampling rate."
  
  
  =====================================
  If I did 48000 / 8192, I would get a freq resolution of 5.8.  Not....awful
  48000 / 16384 = 2.92.  Maybe try this?
  Or...try lowering sample rate?
  
  
  
  
  Test:
  Sample rate = 48000
  fft size = 16384
  E spike was in bin 55/56
  
  So...
  Frequency bin width = 2.92
  55 * 2.92 = 160.6
  56 * 2.92 = 163.52
  
  That is super close in that it is twice as much as the expected frequency of E, which is 82.41
  
  
  Test 2:
  High E string (expected freq of 329.63 Hz)
  I definitely saw the harmonic spikes...sometimes highest spike was 225 and sometimes 338
  225 * 2.92 = 657
  Again...twice as much as expected frequency of high E
  */
