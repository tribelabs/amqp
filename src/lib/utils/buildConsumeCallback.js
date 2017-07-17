var lasync = require('lasync')

var log = (error) => {
  if (error instanceof Error) {
    return console.warn
  }

  return console.log
}

module.exports = (queue, callbacks, debug) => {
  return (data, properties) => {
    return new Promise((resolve, reject) => {
      lasync.waterfall(callbacks.map((callback) => {
        return (...args) => {
          return callback(...[data, ...args, properties])
        }
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
