
function startMicrophoneRecording() {
    document.body.removeEventListener('click', startMicrophoneRecording)
    document.getElementById('title').style.display = 'none'
    document.getElementById('footer').style.display = 'block'

    
    var Mic = new Microphone(1024 * 16)
  
    Mic.init()
}

document.body.addEventListener('click', startMicrophoneRecording)