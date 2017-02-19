var createCallback = require('./consumer/createCallback.js')
var prefetch = require('./channel/prefetch.js')

var defaults = {
  prefetch: false
}

module.exports = (createExchange, debug) => {
  return (name, callback, opts) => {
    debug('Add exchange consumer for', name)
    opts = Object.assign({}, defaults, opts)

    return createExchange(name)
    .then((channel) => {
      if (opts.prefetch === true || typeof opts.prefetch === 'number') {
        return prefetch(debug)(channel, opts.prefetch)
      }

      return channel
    })
    .then((channel) => {
      return channel.assertQueue('', {
        exclusive: true
      })
      .then((qok) => {
        return channel.bindQueue(qok.queue, name, '')
        .then(() => {
          return qok.queue
        })
      })
      .then((queue) => {
        return channel.consume(queue, createCallback(name, callback, channel, debug), {
          noAck: false
        })
      })
    })
  }
}
