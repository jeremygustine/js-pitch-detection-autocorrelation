function autoCorrelate (buf, sampleRate) {
  //https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js

  //https://github.com/cwilso/PitchDetect/pull/23
  // Implements the ACF2+ algorithm
  var SIZE = buf.length
  var rms = 0

  for (var i = 0; i < SIZE; i++) {
    var val = buf[i]
    rms += val * val
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01)
    // not enough signal
    return -1

  var r1 = 0,
    r2 = SIZE - 1,
    thres = 0.2
  for (var i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < thres) {
      r1 = i
      break
    }
  for (var i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i
      break
    }

  buf = buf.slice(r1, r2)
  SIZE = buf.length

  var c = new Array(SIZE).fill(0)
  for (var i = 0; i < SIZE; i++)
    for (var j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i]

  var d = 0
  while (c[d] > c[d + 1]) d++
  var maxval = -1,
    maxpos = -1
  for (var i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i]
      maxpos = i
    }
  }
  var T0 = maxpos

  var x1 = c[T0 - 1],
    x2 = c[T0],
    x3 = c[T0 + 1]
  a = (x1 + x3 - 2 * x2) / 2
  b = (x3 - x1) / 2
  if (a) T0 = T0 - b / (2 * a)

  return sampleRate / T0
}

function doSomeCoolShit (analyserNode, audioContext) {
  let buffer = new Float32Array(4096)
  let halfBufferLength = Math.floor(buffer.length * 0.5)
  let difference = 0
  let smallestDifference = Number.POSITIVE_INFINITY
  let smallestDifferenceOffset = 0

  // Fill up the wave data.
  analyserNode.getFloatTimeDomainData(buffer)

  // Start an offset of 1. No point in comparing the wave
  // to itself at offset 0.
  for (let o = 1; o < halfBufferLength; o++) {
    difference = 0

    for (let i = 0; i < halfBufferLength; i++) {
      // For this iteration, work out what the
      // difference is between the wave and the
      // offset version.
      difference += Math.abs(buffer[i] - buffer[i + o])
    }

    // Average it out.
    difference /= halfBufferLength

    // If this is the smallest difference so far hold it.
    if (difference < smallestDifference) {
      smallestDifference = difference
      smallestDifferenceOffset = o
    }
  }

  // Now we know which offset yielded the smallest
  // difference we can convert it to a frequency.
  return audioContext.sampleRate / smallestDifferenceOffset
}

function autocorrelateAudioData (time) {
  let searchSize = this.frequencyBufferLength * 0.5
  let sampleRate = this.audioContext.sampleRate
  let offsetKey = null
  let offset = 0
  let difference = 0
  let tolerance = 0.001
  let rms = 0
  let rmsMin = 0.008
  let assessedStringsInLastFrame = this.assessedStringsInLastFrame

  // Fill up the data.
  this.analyser.getFloatTimeDomainData(this.frequencyBuffer)

  // Figure out the root-mean-square, or rms, of the audio. Basically
  // this seems to be the amount of signal in the buffer.
  for (let d = 0; d < this.frequencyBuffer.length; d++) {
    rms += this.frequencyBuffer[d] * this.frequencyBuffer[d]
  }

  rms = Math.sqrt(rms / this.frequencyBuffer.length)

  // If there's little signal in the buffer quit out.
  if (rms < rmsMin) return 0

  // Only check for a new string if the volume goes up. Otherwise assume
  // that the string is the same as the last frame.
  if (rms > this.lastRms + this.rmsThreshold)
    this.assessStringsUntilTime = time + 250

  if (time < this.assessStringsUntilTime) {
    let smallestDifference = Number.POSITIVE_INFINITY
    let smallestDifferenceKey = ''

    this.assessedStringsInLastFrame = true

    // Go through each string and figure out which is the most
    // likely candidate for the string being tuned based on the
    // difference to the "perfect" tuning.
    for (let o = 0; o < this.stringsKeys.length; o++) {
      offsetKey = this.stringsKeys[o]
      offset = this.strings[offsetKey].offset
      difference = 0

      // Reset how often this string came out as the closest.
      if (assessedStringsInLastFrame === false)
        this.strings[offsetKey].difference = 0

      // Now we know where the peak is, we can start
      // assessing this sample based on that. We will
      // step through for this string comparing it to a
      // "perfect wave" for this string.
      for (let i = 0; i < searchSize; i++) {
        difference += Math.abs(
          this.frequencyBuffer[i] - this.frequencyBuffer[i + offset]
        )
      }

      difference /= searchSize

      // Weight the difference by frequency. So lower strings get
      // less preferential treatment (higher offset values). This
      // is because harmonics can mess things up nicely, so we
      // course correct a little bit here.
      this.strings[offsetKey].difference += difference * offset
    }
  } else {
    this.assessedStringsInLastFrame = false
  }

  // If this is the first frame where we've not had to reassess strings
  // then we will order by the string with the largest number of matches.
  if (
    assessedStringsInLastFrame === true &&
    this.assessedStringsInLastFrame === false
  ) {
    this.stringsKeys.sort(this.sortStringKeysByDifference)
  }

  // Next for the top candidate in the set, figure out what
  // the actual offset is from the intended target.
  // We'll do it by making a full sweep from offset - 10 -> offset + 10
  // and seeing exactly how long it takes for this wave to repeat itself.
  // And that will be our *actual* frequency.
  let searchRange = 10
  let assumedString = this.strings[this.stringsKeys[0]]
  let searchStart = assumedString.offset - searchRange
  let searchEnd = assumedString.offset + searchRange
  let actualFrequency = assumedString.offset
  let smallestDifference = Number.POSITIVE_INFINITY

  for (let s = searchStart; s < searchEnd; s++) {
    difference = 0

    // For each iteration calculate the difference of every element of the
    // array. The data in the buffer should be PCM, so values ranging
    // from -1 to 1. If they match perfectly then they'd essentially
    // cancel out. But this is real data so we'll be looking for small
    // amounts. If it's below tolerance assume a perfect match, otherwise
    // go with the smallest.
    //
    // A better version of this would be to curve match on the data.
    for (let i = 0; i < searchSize; i++) {
      difference += Math.abs(
        this.frequencyBuffer[i] - this.frequencyBuffer[i + s]
      )
    }

    difference /= searchSize

    if (difference < smallestDifference) {
      smallestDifference = difference
      actualFrequency = s
    }

    if (difference < tolerance) {
      actualFrequency = s
      break
    }
  }

  this.lastRms = rms

  return this.audioContext.sampleRate / actualFrequency
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
        var ac = autoCorrelate(self.spectrum, context.sampleRate)
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
