var createCallback = require('./consumer/createCallback.js')

module.exports = (createExchange, debug) => {
  return (name, callback) => {
    debug('Add exchange consumer for', name)

    return createExchange(name)
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
