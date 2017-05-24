var uuid = require('uuid')

var validateMessageToPublish = require('./validator/validateMessageToPublish.js')

var defaults = {
  autoDeleteCallback: false
}

module.exports = (createQueue, debug) => {
  var maybeAnswer = (channel, corrId, callback, autoDelete) => {
    return (msg) => {
      if (msg.properties.correlationId === corrId) {
        callback(JSON.parse(msg.content.toString()))
        channel.ack(msg)

        if (autoDelete === true) {
          debug('Cancel channel consumer', msg.fields.consumerTag)
          channel.cancel(msg.fields.consumerTag)
        }
      }
    }
  }

  return function (queue, message, callback, opts) {
    opts = Object.assign({}, defaults, (opts || {}))
    var listenForReply = typeof callback === 'function'

    debug('Should be published', queue)

    return new Promise(function (resolve, reject) {
      createQueue(queue)
      .then((channel) => {
        var corrId = uuid()

        if (listenForReply) {
          return channel.assertQueue('', {
            exclusive: true, // do not allow others to use this queue
            autoDelete: true // the queue will be deleted when the number of consumers drops to zero
          })
          .then((replyChannel) => {
            var consumer = maybeAnswer(channel, corrId, callback, opts.autoDeleteCallback)

            return channel.consume(replyChannel.queue, consumer)
            .then(() => {
              return {
                channel: channel,
                replyTo: replyChannel.queue,
                correlationId: corrId
              }
            })
          })
        }

        return {
          channel: channel,
          replyTo: null,
          correlationId: corrId
        }
      })
      .then((results) => {
        debug('Publish', queue, message, opts)
        message = validateMessageToPublish(message)

        return results.channel.sendToQueue(queue, message, {
          correlationId: results.correlationId,
          replyTo: results.replyTo,
          timestamp: Date.now()
        })
      })
      .then(resolve)
      .catch((error) => {
        debug('Publish error', error)
        reject(error)
      })
    })
  }
}
