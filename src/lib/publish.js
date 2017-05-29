var uuid = require('uuid')

var validateMessageToPublish = require('./validator/validateMessageToPublish.js')

var defaults = {
  autoDeleteCallback: false
}

var parseArgs = (args) => {
  var queue = args.shift()
  var message = args.shift()
  var callback = null
  var opts = null

  if (args.length === 2) {
    callback = args.shift()
    opts = args.shift()
  } else if (args.length === 1) {
    if (typeof args[0] !== 'function') {
      opts = args.shift()
    } else {
      callback = args.shift()
    }
  }

  return {
    queue,
    message,
    callback,
    opts
  }
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

  var createQueueForAnswer = (channel, consumer) => {
    debug('Creating queue for answer on...')

    return channel.assertQueue('', {
      exclusive: true, // do not allow others to use this queue
      autoDelete: true // the queue will be deleted when the number of consumers drops to zero
    })
    .then((replyChannel) => {
      return channel.consume(replyChannel.queue, consumer)
      .then(() => {
        return replyChannel.queue
      })
    })
  }

  var createQueueForAnswerIfNeed = (channel, callback, opts) => {
    var listenForReply = typeof callback === 'function'
    var corrId = uuid()

    var promise = Promise.resolve(null)

    if (listenForReply) {
      promise = createQueueForAnswer(channel, maybeAnswer(channel, corrId, callback, opts.autoDeleteCallback))
    }

    return promise.then((replyChannel) => {
      return {
        channel: channel,
        replyTo: replyChannel,
        correlationId: corrId
      }
    })
  }

  return function (...args) { // queue, message, callback, opts
    var { queue, message, callback, opts } = parseArgs(args)

    opts = Object.assign({}, defaults, (opts || {}))

    debug('Should be published', queue)

    return new Promise(function (resolve, reject) {
      createQueue(queue)
      .then((channel) => {
        return createQueueForAnswerIfNeed(channel, callback, opts)
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
