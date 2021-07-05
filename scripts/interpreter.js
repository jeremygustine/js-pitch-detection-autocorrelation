function getFundamentalFrequency (frequency) {

    for (var i = 1; i <= 5; i++) {
        frequency /= i
        if (frequency < 160) {
            return frequency
        }
    }
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
}
var notes = [73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.8, 110, 116.5, 123.5, 130.8, 138.6, 146.8, 155.6]
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
