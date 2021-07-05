/*
Since the most prominent frequency could be a harmonic, divide it continually until the frequency
is within the range of the fundamental frequencies we are interested in
*/
function getFundamentalFrequency (frequency) {
    for (var i = 1; i <= 5; i++) {
        var currentHarmonic = frequency  / i
        if (currentHarmonic < 350) {
            return currentHarmonic
        }
    }

    return frequency
}

var n = {
    '73.42': 'D',
    '77.78': 'D#',
    '82.41': 'E',
    '87.31': 'F',
    '92.5': 'F#',
    '98': 'G',
    '103.8': 'G#',
    '110': 'A',
    '116.5': 'A#',
    '123.5': 'B',
    '130.8': 'C',
    '138.6': 'C#',
    '146.8': 'D',
    '155.6': 'D#',
    '164.8': 'E',
    '174.6': 'F',
    '185': 'F#',
    '196': 'G',
    '207.7': 'G#',
    '220': 'A',
    '233.1': 'A#',
    '246.9': 'B',
    '261.6': 'C',
    '277.2': 'C#',
    '293.7': 'D',
    '311.1': 'D#',
    '329.6': 'E',
    '349.2': 'F',
}

var notes = [73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.8, 110, 116.5, 123.5, 130.8, 138.6, 146.8, 155.6, 164.8, 174.6, 185, 196, 207.7, 220, 233.1, 246.9, 261.6, 277.2, 293.7, 311.1, 329.6, 349.2]
function getClosestNoteFrequency (frequency) {
    var smallestDifference = Number.MAX_SAFE_INTEGER;
    var closestNote = Number.MAX_SAFE_INTEGER
    for (var i = 0; i < notes.length; i++) {
      var difference = Math.abs(frequency - notes[i])
      if (difference < smallestDifference) {
          smallestDifference = difference
          closestNote = notes[i]
      }
    }
    return closestNote
}

function getNoteLetter(frequency) {
    return n[frequency.toString()]
}
