// run using electron-spawn

var RandomAccessAudioBuffer = require('./')
var audioContext = new window.AudioContext()

var filePath = '/Users/matt/Projects/Destroy With Science/Live Sets/Art~Hack 9 July 2015.wav'

var get = RandomAccessAudioBuffer(filePath, {
  fs: require('fs'),
  audio: audioContext
})

get(1000, 4, function (err, audioBuffer) {
  if (err) throw err

  var startTime = audioContext.currentTime
  play(startTime, audioBuffer)

  setTimeout(function () {
    get(1004, 4, function (err, audioBuffer) {
      play(startTime + 4, audioBuffer)
    })
  }, 3800)
})

function play (at, audioBuffer) {
  console.log('playing audio at', at)
  var player = audioContext.createBufferSource()
  player.buffer = audioBuffer
  player.connect(audioContext.destination)
  player.start(at)
}
