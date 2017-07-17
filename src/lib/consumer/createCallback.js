var uid = require('uuid')

var stringify = require('../json/stringify.js')
var parse = require('../json/parse.js')

var isPromise = (value) => {
  return value && typeof value.then === 'function'
}

module.exports = (queue, callback, channel, debug) => {
  return (msg) => {
    if (msg === null) {
      debug('No message for queue task')
      return
    }

    var properties = msg.properties || {}
    var timeLabel = null

    if (debug.isAllowed()) {
      timeLabel = queue + '_' + (properties.correlationId || uid())
      console.time(timeLabel)
    }

    var result = null
    try {
      result = callback(parse(msg.content ? msg.content.toString() : msg.toString()), properties)
    } catch (e) {
      console.warn('Consume error', e)
      if (e && e.stack) {
        console.warn(e.stack)
      }
    }

    var finish = (message) => {
      if (timeLabel) {
        console.timeEnd(timeLabel)
      }

      var taskName = queue
      if (properties.appId) {
        taskName += ' from ' + properties.appId
      }

      debug('Task', taskName, 'finished, with message:', message, ', took:', (Date.now() - properties.timestamp) / 1000)

      if (properties.replyTo) {
        debug('Send reply', properties.replyTo, properties.correlationId)
        var response = stringify(message) || ''
        channel.sendToQueue(properties.replyTo, new Buffer(response), {
          correlationId: properties.correlationId
        })
      }

      channel.ack(msg)
    }

    if (isPromise(result)) {
      result
      .then(finish)
      .catch((error) => {
        console.warn('Consume promise error', error)
        channel.ack(msg)
      })
    } else {
      finish(result)
    }
  }
}
