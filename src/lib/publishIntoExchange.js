var isNil = require('is-nil')

module.exports = (createExchange, debug) => {
  return (name, message) => {
    debug('should be published into exchange', name, message)

    return createExchange(name)
    .then((channel) => {
      debug('publish into exchange', name, message)

      if (isNil(message)) {
        message = new Buffer(JSON.stringify({}))
      } else {
        message = new Buffer(JSON.stringify(message))
      }

      return channel.publish(name, '', message, {
        timestamp: Date.now()
      })
    })
    .catch((error) => {
      console.warn('Publish into exchange error', error)
      return error
    })
  }
}
