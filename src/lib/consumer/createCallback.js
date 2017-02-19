var counter = 0

module.exports = (queue, callback, channel, debug) => {
  return (msg) => {
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
      if (timeLabel) {
        console.timeEnd(timeLabel)
      }

      debug('Task', queue, 'finished, with message', message, 'took:', (Date.now() - properties.timestamp) / 1000)

      if (properties.replyTo) {
        debug('Send reply', properties.replyTo, properties.correlationId)
        channel.sendToQueue(properties.replyTo, new Buffer(JSON.stringify(message)), {
          correlationId: properties.correlationId
        })
      }

      channel.ack(msg)
    })
    .catch((error) => {
      console.warn('Consume promise error', error)
      channel.ack(msg)
    })
  }
}
