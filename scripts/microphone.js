
function Microphone (_fft) {
  var FFT_SIZE = 4096
  this.spectrum = []
  this.volume = this.vol = 0
  this.peak_volume = 0
  var self = this
  var audioContext = new AudioContext({ sampleRate: 48000 / 2 / 2 })
  // var audioContext = new AudioContext()
  var SAMPLE_RATE = audioContext.sampleRate


  window.AudioContext = window.AudioContext || window.webkitAudioContext
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia


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
      var analyser = context.createAnalyser()
      analyser.smoothingTimeConstant = 0.2
      analyser.fftSize = FFT_SIZE
      var node = context.createScriptProcessor(FFT_SIZE, 1, 1)
      node.onaudioprocess = function () {
        self.spectrum = new Float32Array(4096)
        analyser.getFloatTimeDomainData(self.spectrum)
        interpret(self.spectrum, context.sampleRate)
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