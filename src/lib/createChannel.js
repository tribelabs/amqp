module.exports = (storage, connect, debug) => {
  var createRawChannel = () => {
    return connect()
    .then((conn) => {
      return conn.createChannel()
    })
  }

  var createChannel = (queue) => {
    if (!queue) {
      throw new Error('Missing queue name')
    }

    var channel = storage(queue)

    if (!channel) {
      debug('Create channel for', queue)
      channel = new Promise((resolve, reject) => {
        createRawChannel()
        .then((channel) => {
          return channel.assertQueue(queue)
          .then(() => {
            return channel
          })
        })
        .then((channel) => {
          resolve(channel)
        })
        .catch((error) => {
          reject(error)
        })
      })

      storage.set(channel)
    }

    return channel
  }

  return createChannel
}
