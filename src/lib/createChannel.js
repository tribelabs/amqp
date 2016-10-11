module.exports = (storage, connect, debug) => {
  var createChannel = function (queue) {
    if (!queue) {
      throw new Error('Missing queue name')
    }

    if (!storage[queue]) {
      debug('create channel for', queue)
      storage[queue] = new Promise((resolve, reject) => {
        connect()
        .then(function (conn) {
          return conn.createChannel()
        })
        .then(function (channel) {
          return channel.assertQueue(queue)
          .then(() => {
            return channel
          })
        })
        .then((channel) => {
          resolve(channel)
        })
        .catch(function (error) {
          reject(error)
        })
      })
    }

    return storage[queue]
  }

  return createChannel
}
