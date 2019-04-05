/* globals tape */
/* eslint no-console: 0 */

// geckodriver does not support accessing logs
//    https://github.com/mozilla/geckodriver/issues/330
// So pipe console.log to a buffer that is retrieved via renderComplete

var _tape_buffer = []
tape.createStream().on('data', function(v) {
  console.log(v)
  _tape_buffer.push(v)
})
tape.onFinish(function () {
  window.renderComplete = _tape_buffer
})
