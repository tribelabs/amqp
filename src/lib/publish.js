var uuid = require('node-uuid')

module.exports = (createChannel, debug) => {
  return function (queue, message, callback) {
    var listenForReply = typeof callback === 'function'

    debug('Should be published', queue, message)

    return new Promise(function (resolve, reject) {
      createChannel(queue)
      .then((channel) => {
        if (listenForReply) {
          var corrId = uuid()
          var maybeAnswer = (msg) => {
            if (msg.properties.correlationId === corrId) {
              callback(JSON.parse(msg.content.toString()))
              channel.ack(msg)
            }
          }

          return channel.assertQueue('', {
            exclusive: true
          })
          .then((r) => {
            return r.queue
          })
          .then((consumer) => {
            return channel.consume(consumer, maybeAnswer)
            .then(() => {
              return {
                channel: channel,
                replyTo: consumer,
                correlationId: corrId
              }
            })
          })
        }

        return {
          channel: channel,
          replyTo: null,
          correlationId: null
        }
      })
      .then((results) => {
        debug('Publish', queue, message)
        return results.channel.sendToQueue(queue, new Buffer(JSON.stringify(message)), {
          correlationId: results.correlationId,
          replyTo: results.replyTo
        })
      })
      .then(resolve)
      .catch((error) => {
        console.warn('Publish error', error)
        reject(error)
      })
    })
  }
}
