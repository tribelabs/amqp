var validateMessageToPublish = require('./validator/validateMessageToPublish.js')

module.exports = (createExchange, debug) => {
  return (name, message) => {
    debug('should be published into exchange', name, message)

    return createExchange(name)
    .then((channel) => {
      message = validateMessageToPublish(message)
      debug('publish into exchange', name, message)

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
