var create = require('./channel/create.js')

module.exports = (storage, connect, debug) => {
  return (name, type, opts) => {
    opts = Object.assign({
      durable: false
    }, opts || {})

    var channel = storage(name)
    if (!channel) {
      channel = new Promise((resolve, reject) => {
        create(connect)
        .then((ch) => {
          return ch.assertExchange(name, type || 'fanout', opts)
          .then(() => {
            resolve(ch)
          })
        })
        .catch((error) => {
          debug('Error in creating of channel, unset it', error)
          storage.unset()
          reject(error)
        })
      })

      storage.set(channel)
    }

    return channel
  }
}
