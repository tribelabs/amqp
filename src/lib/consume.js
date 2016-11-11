var defaults = {
  prefetch: false
}

var counter = 0

module.exports = (createChannel, debug) => {
  return (queue, callback, opts) => {
    debug('Add consumer for', queue)
    opts = Object.assign({}, defaults, opts)

    return new Promise((resolve, reject) => {
      createChannel(queue)
      .then((channel) => {
        if (opts.prefetch === true || typeof opts.prefetch === 'number') {
          var prefetch = opts.prefetch === true ? 1 : Number(opts.prefetch)
          debug('Prefetch channel', queue, 'with', prefetch)
          return channel.prefetch(prefetch)
          .then(() => {
            return channel
          })
        }

        return channel
      })
      .then((channel) => {
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
