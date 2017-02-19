var counter = 0

module.exports = (createExchange, debug) => {
  return (name, callback) => {
    debug('Add exchange consumer for', name)

    return createExchange(name)
    .then((channel) => {
      return channel.assertQueue('', {
        exclusive: true
      })
      .then((qok) => {
        return channel.bindQueue(qok.queue, name, '')
        .then(() => {
          return qok.queue
        })
      })
      .then((queue) => {
        return channel.consume(queue, (msg) => {
          if (msg === null) {
            debug('No message for queue task')
            return
          }

          var properties = msg.properties || {}
          var timeLabel = null

          if (debug.isAllowed()) {
            timeLabel = queue + '_' + (properties.correlationId || counter++)
            console.time(timeLabel)
          }

          var result = null
          try {
            result = callback(JSON.parse(msg.content ? msg.content.toString() : msg.toString()))
          } catch (e) {
            console.warn('Exchange consume error', e)
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
            if (timeLabel) {
              console.timeEnd(timeLabel)
            }

            debug('Task', queue, 'finished, with message', message, 'took:', (Date.now() - properties.timestamp) / 1000)

            channel.ack(msg)
          })
          .catch((error) => {
            console.warn('Consume promise error', error)
            channel.ack(msg)
          })
        }, {
          noAck: false
        })
      })
    })
  }
}
