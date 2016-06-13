var parseWebm = require('./lib/parse-webm')

module.exports = function getMeta (descriptor, fs, cb) {
  // read first 12 bytes
  // chunks from now on. 4 byte identifier ASCII, 4 byte size UInt32LE
  // read to next chunk

  var chunks = {}
  var header = null
  var stats = null

  fs.fstat(descriptor, function (err, res) {
    if (err) return cb && cb(err)
    stats = res

    read(descriptor, fs, 0, 12, function (err, buffer) {
      if (err) return cb && cb(err)
      header = buffer
      if (isWav(header)) {
        nextChunk(12)
      } else if (isWebm(header)) {
        parseWebm(descriptor, fs, cb)
      }
    })
  })

  function nextChunk (start) {
    read(descriptor, fs, start, 8, function (err, buffer) {
      if (err) return cb && cb(err)

      var name = buffer.slice(0, 4).toString('ascii').trim()
      var maxLength = stats.size - (start + 8)
      var length = Math.min(buffer.readUInt32LE(4) || maxLength, maxLength)

      chunks[name] = [start + 8, length]

      var next = start + length + 8
      if (next < stats.size) {
        nextChunk(next)
      } else {
        done()
      }
    })
  }

  function done () {
    getFormat(descriptor, fs, chunks.fmt[0], function (err, format) {
      if (err) return cb && cb(err)
      cb(null, {
        header: header,
        format: format,
        chunks: chunks,
        size: stats.size,
        duration: chunks.data[1] / format.byteRate
      })
    })
  }
}

function getFormat (fd, fs, offset, cb) {
  read(fd, fs, offset, 16, function (err, buffer) {
    if (err) return cb && cb(err)
    cb(null, {
      format: buffer.readUInt16LE(0),
      channels: buffer.readUInt16LE(2),
      sampleRate: buffer.readUInt32LE(4),
      byteRate: buffer.readUInt32LE(8),
      blockAlign: buffer.readUInt16LE(12),
      bitsPerSample: buffer.readUInt16LE(14)
    })
  })
}

function read (fd, fs, start, length, cb) {
  var result = new Buffer(length)
  fs.read(fd, result, 0, length, start, function (err) {
    cb(err, result)
  })
}

function isWebm (buf) {
  if (!buf || buf.length < 4) {
    return false
  }

  return buf[0] === 26 && buf[1] === 69 && buf[2] === 223 && buf[3] === 163
}

function isWav (buf) {
  return buf.slice(0, 4).toString() === 'RIFF'
}
