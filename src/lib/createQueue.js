var create = require('./channel/create.js')

module.exports = (storage, connect, debug) => {
  return (queue, opts) => {
    var channel = storage(queue)

    if (!channel) {
      debug('Create channel queue for', queue)
      channel = new Promise((resolve, reject) => {
        create(connect)
        .then((ch) => {
          return ch.assertQueue(queue, opts || {})
          .then(() => {
            resolve(ch)
          })
        })
        .catch((error) => {
          debug('Error in creating of queue channel, unset it', error)
          storage.unset()
          reject(error)
        })
      })

      storage.set(channel)
    }

    return channel
  }
}
