audio-buffer-range-decoder
===

Decode specified ranges of wave file on disk to AudioBuffers.

Useful for streaming large audio files from disk when you don't want to load the whole thing into memory.

[![NPM](https://nodei.co/npm/audio-buffer-range-decoder.png)](https://nodei.co/npm/audio-buffer-range-decoder/)

## API

```js
var RangeDecoder = require('audio-buffer-range-decoder')
```

### `var decodeRange = RangeDecoder(filePath, options)`

Specify `filePath` on disk. Opens the file ready for access. 

Returns a decode function.

*Options:*
 - `fs`: pass in [fs](https://nodejs.org/api/fs.html) implementation (required)
 - `audio`: instance of `AudioContext` to use for decoding (required)

### `decodeRange(startTime, duration, callback)`

Pass in `startTime` and `duration` in seconds. `callback(err, audioBuffer)` will be called when data has been decoded or an error has occurred.

### `decodeRange.close()`

Call this when you are done reading to close the underlying file descriptor.