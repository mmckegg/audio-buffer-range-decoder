var ebml = require('ebml')

module.exports = function (descriptor, fs, cb) {
  var cues = []
  var decoder = new ebml.Decoder()
  var stream = fs.createReadStream(null, {fd: descriptor, autoClose: false})
  var offsetTime = 0
  var format = {}
  decoder.on('data', function (chunk) {
    if (chunk[0] === 'tag') {
      if (chunk[1].name === 'SimpleBlock') {
        cues.push([chunk[1].data.readInt16BE(1) + offsetTime, chunk[1].start + 3, chunk[1].end + 3])
      } else if (chunk[1].name === 'Timecode') {
        offsetTime = toInt(chunk[1].data)
      } else if (chunk[1].name === 'SamplingFrequency') {
        format.sampleRate = chunk[1].data.readFloatBE(0)
      } else if (chunk[1].name === 'Channels') {
        format.channels = toInt(chunk[1].data)
      } else if (chunk[1].name === 'CodecID') {
        format.codec = chunk[1].data.toString()
      }
    }
  })

  decoder.on('end', next)
  stream.pipe(decoder)

  function next () {
    if (cues.length) {
      read(descriptor, fs, 0, cues[0][1], finish)
    } else {
      cb && cb(new Error('File is empty'))
    }
  }

  function finish (err, header) {
    if (cb) {
      if (err) return cb(err)
      var lastFrameDuration = cues.length > 1 ? cues[cues.length - 1][0] - cues[cues.length - 2][0] : 0
      cb(null, {
        type: 'webm',
        format: format,
        cues: cues,
        header: header,
        duration: (cues[cues.length - 1][0] + lastFrameDuration) / 1000
      })
    }
  }
}

function read (fd, fs, start, length, cb) {
  var result = new Buffer(length)
  fs.read(fd, result, 0, length, start, function (err) {
    cb(err, result)
  })
}

function toInt (buffer) {
  var target = Buffer.alloc(4)
  var offset = target.length - buffer.length
  for (var i = 0; i < buffer.length; i++) {
    target[i + offset] = buffer[i]
  }
  return target.readInt32BE(0)
}
