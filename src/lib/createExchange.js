var createChannel = require('./createChannel.js')

module.exports = (storage, connect, debug) => {
  return (name, type, opts) => {
    opts = Object.assign({
      durable: false
    }, opts || {})

    var channel = storage(name)
    if (!channel) {
      channel = createChannel(connect)
      .then((channel) => {
        return channel.assertExchange(name, type || 'fanout', opts)
        .then(() => {
          return channel
        })
      })
      storage.set(channel)
    }

    return channel
  }
}
