var createCallback = require('./consumer/createCallback.js')
var prefetch = require('./channel/prefetch.js')
var buildConsumeCallback = require('./utils/buildConsumeCallback.js')

var defaults = {
  prefetch: false
}

module.exports = (createQueue, debug) => {
  return (queue, callback, opts) => {
    debug('Add consumer for', queue)
    opts = Object.assign({}, defaults, opts)

    if (Array.isArray(callback)) {
      callback = buildConsumeCallback(queue, callback)
    }

    return new Promise((resolve, reject) => {
      createQueue(queue)
      .then((channel) => {
        if (opts.prefetch === true || typeof opts.prefetch === 'number') {
          return prefetch(debug)(channel, opts.prefetch)
        }

        return channel
      })
      .then((channel) => {
        return channel.consume(queue, createCallback(queue, callback, channel, debug), {
          noAck: false
        })
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => {
        debug('Creating of consumer failed', error)
        reject(error)
      })
    })
  }
}
