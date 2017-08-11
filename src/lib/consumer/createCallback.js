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

    if (!result) {
      result = Promise.resolve(null)
    }

    var finish = (message) => {
      if (timeLabel) {
        console.timeEnd(timeLabel)
      }

      var args = ['Task', queue]

      if (properties.appId) {
        args.push('from ' + properties.appId)
      }

      args.push('finished')

      if (typeof message !== 'undefined') {
        args.push(', with message:', message)
      } else {
        message = null
      }

      var diff = (Date.now() - properties.timestamp) / 1000
      args.push(', took:', diff)

      debug(...args)

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
