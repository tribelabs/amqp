module.exports = (createChannel, debug) => {
  return (queue, callback) => {
    debug('Add consumer for', queue)

    return new Promise((resolve, reject) => {
      createChannel(queue)
      .then((channel) => {
        return channel.prefetch(1)
        .then(() => {
          return channel
        })
      })
      .then((channel) => {
        return channel.consume(queue, (msg) => {
          if (msg === null) {
            debug('No message for queue task')
            return
          }

          var result = null
          try {
            result = callback(JSON.parse(msg.content ? msg.content.toString() : msg.toString()))
          } catch (e) {
            console.warn('Consume error', e)
            if (e && e.stack) {
              console.warn(e.stack)
            }
          }

          if (!result) {
            result = Promise.resolve(null)
          }

          if (result && typeof result.then !== 'function') {
            result = Promise.resolve(result)
          }

          result
          .then((message) => {
            debug('Task', queue, 'finished, with message', message)

            if (msg.properties && msg.properties.replyTo) {
              debug('Send reply', msg.properties.replyTo, msg.properties.correlationId)
              channel.sendToQueue(msg.properties.replyTo, new Buffer(JSON.stringify(message)), {
                correlationId: msg.properties.correlationId
              })
            }

            channel.ack(msg)
          })
          .catch((error) => {
            console.warn('Consume promise error', error)
            channel.ack(msg)
          })
        }, {
          noAct: false
        })
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => {
        console.warn('Creating of consumer failed', error)
        reject(error)
      })
    })
  }
}
