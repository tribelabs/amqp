var uuid = require('uuid')

var validateMessageToPublish = require('./validator/validateMessageToPublish.js')

module.exports = (createExchange, debug) => {
  return (name, message) => {
    debug('should be published into exchange', name, message)

    return createExchange(name)
    .then((channel) => {
      debug('publish into exchange', name, message)
      message = validateMessageToPublish(message)

      return channel.publish(name, '', message, {
        correlationId: uuid(),
        timestamp: Date.now()
      })
    })
    .catch((error) => {
      console.warn('Publish into exchange error', error)
      return error
    })
  }
}
