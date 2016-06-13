var ebml = require('ebml')

module.exports = function (descriptor, fs, cb) {
  var cues = []
  var decoder = new ebml.Decoder()
  var stream = fs.createReadStream(null, {fd: descriptor, autoClose: false})
  var offsetTime = 0
  decoder.on('data', function (chunk) {
    if (chunk[0] === 'tag') {
      if (chunk[1].name === 'SimpleBlock') {
        cues.push([chunk[1].data.readInt16BE(1) + offsetTime, chunk[1].start + 3, chunk[1].end + 3])
      } else if (chunk[1].name === 'Timecode') {
        offsetTime = toInt(chunk[1].data)
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
  if (buffer.length === 1) {
    return buffer.readInt8(0)
  } else if (buffer.length === 2) {
    return buffer.readInt16BE(0)
  } else if (buffer.length === 3) {
    return buffer.readInt32BE(0)
  }
}
