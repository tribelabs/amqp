var lasync = require('lasync')
var apply = require('node-apply')

var log = (error) => {
  if (error instanceof Error) {
    return console.warn
  }

  return console.log
}

module.exports = (queue, callbacks, debug) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      lasync.waterfall(callbacks.map((callback) => {
        return apply(callback, ...args)
      }), (error, result) => {
        if (error) {
          log(error)('Error occurred in queue "' + queue + '" middleware:', error)
          if (error.stack) {
            log(error)(error.stack)
          }
        }

        resolve(result)
      })
    })
  }
}
