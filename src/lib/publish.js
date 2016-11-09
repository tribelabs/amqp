var uuid = require('node-uuid')

var defaults = {
  autoDeleteCallback: false
}

module.exports = (createChannel, debug) => {
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

    debug('Should be published', queue, message, opts)

    return new Promise(function (resolve, reject) {
      createChannel(queue)
      .then((channel) => {
        var corrId = uuid()
        var timestamp = Date.now()

        if (listenForReply) {
          return channel.assertQueue('', {
            exclusive: true, // do not allow others to use this queue
            autoDelete: true // the queue will be deleted when the number of consumers drops to zero
          })
          .then((r) => {
            return r.queue
          })
          .then((queueName) => {
            var consumer = maybeAnswer(channel, corrId, callback, opts.autoDeleteCallback)

            return channel.consume(queueName, consumer)
            .then(() => {
              return {
                channel: channel,
                replyTo: queueName,
                correlationId: corrId,
                created: timestamp
              }
            })
          })
        }

        return {
          channel: channel,
          replyTo: null,
          correlationId: corrId,
          created: timestamp
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
