var uuid = require('node-uuid')

var validateMessageToPublish = require('./validator/validateMessageToPublish.js')

module.exports = (createExchange, debug) => {
  return (name, message) => {
    debug('should be published into exchange', name, message)

    return new Promise((resolve, reject) => {
      createExchange(name)
      .then((channel) => {
        debug('publish into exchange', name, message)
        message = validateMessageToPublish(message)

        return channel.publish(name, '', message, {
          correlationId: uuid(),
          timestamp: Date.now()
        })
      })
      .then(resolve)
      .catch((error) => {
        debug('Publish into exchange error', error)
        reject(error)
      })
    })
  }
}
