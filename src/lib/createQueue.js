var createChannel = require('./createChannel.js')

module.exports = (storage, connect, debug) => {
  var createQueue = (queue) => {
    var channel = storage(queue)

    if (!channel) {
      debug('Create channel queue for', queue)
      channel = createChannel(connect)
      .then((channel) => {
        return channel.assertQueue(queue)
        .then(() => {
          return channel
        })
      })

      storage.set(channel)
    }

    return channel
  }

  return createQueue
}