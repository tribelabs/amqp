var lasync = require('lasync')
var apply = require('node-apply')

module.exports = (queue, callbacks) => {
  return function () {
    var args = arguments

    return new Promise((resolve, reject) => {
      lasync.waterfall(callbacks.map((callback) => {
        return apply(callback, ...args)
      }), (error, result) => {
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
