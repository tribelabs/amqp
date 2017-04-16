var lasync = require('lasync')
var apply = require('node-apply')

module.exports = (queue, callbacks, debug) => {
  return function () {
    var args = arguments

    callbacks = callbacks.map((callback) => {
      return apply(callback, ...args)
    })

    return new Promise((resolve, reject) => {
      debug('Running consume callbacks for:', queue, '#' + callbacks.length)

      lasync.waterfall(callbacks, (error, result) => {
        if (error) {
          console.warn('Error occurred in queue "' + queue + '" middleware:', error)
          if (error.stack) {
            console.warn(error.stack)
          }
        }

        resolve(result)
      })
    })
  }
}
