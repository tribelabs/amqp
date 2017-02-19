var defaults = {
  prefetch: false
}

var createCallback = require('./consumer/createCallback.js')

module.exports = (createQueue, debug) => {
  return (queue, callback, opts) => {
    debug('Add consumer for', queue)
    opts = Object.assign({}, defaults, opts)

    return new Promise((resolve, reject) => {
      createQueue(queue)
      .then((channel) => {
        if (opts.prefetch === true || typeof opts.prefetch === 'number') {
          var prefetch = opts.prefetch === true ? 1 : Number(opts.prefetch)
          debug('Prefetch channel', queue, 'with', prefetch)
          return channel.prefetch(prefetch)
          .then(() => {
            return channel
          })
        }

        return channel
      })
      .then((channel) => {
        return channel.consume(queue, createCallback(queue, callback, channel, debug), {
          noAct: false
        })
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => {
        console.warn('Creating of consumer failed', error)
        reject(error)
      })
    })
  }
}
