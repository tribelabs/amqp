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

    if (!storage[queue]) {
      debug('Create channel for', queue)
      storage[queue] = new Promise((resolve, reject) => {
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
    }

    return storage[queue]
  }

  return createChannel
}
