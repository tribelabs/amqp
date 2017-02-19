var amqp = require('amqplib')

var middleware = require('./middleware.js')
var publish = require('./lib/publish.js')
var publishIntoExchange = require('./lib/publishIntoExchange.js')
var consume = require('./lib/consume.js')
var consumeExchange = require('./lib/consumeExchange.js')
var storage = require('./lib/storage.js')
var createQueue = require('./lib/createQueue.js')
var createExchange = require('./lib/createExchange.js')

var _config = null

var connection = null
var connect = () => {
  if (!connection) {
    connection = new Promise((resolve, reject) => {
      debug('Create new rabbit connection', _config)

      amqp.connect(_config.connection)
      .then((model) => {
        model.on('close', () => {
          debug('"Close" event emitted, emitting callbacks:', onClose.length)
          emitListeners(onClose, [model])
        })

        model.on('error', (error) => {
          debug('"Error" event emitted, emitting callbacks:', onError.length)
          emitListeners(onError, [error, model])
        })

        resolve(model)
      })
      .catch((error) => {
        console.warn('AMQP connect failed', error)
        if (error && error.stack) {
          console.log(error.stack)
        }

        reject(error)
      })
    })
  }

  return connection
}

var debug = function () {
  if (_config.debug === true) {
    console.log.apply(null, arguments)
  }
}

debug.isAllowed = () => {
  return (_config || {}).debug
}

var onClose = []
var onError = []

var addListener = (storage) => {
  if (!Array.isArray(storage)) {
    throw new Error('Listeners storage has to be array')
  }

  return (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback has to be function')
    }

    storage.push(callback)
  }
}

var emitListeners = (callbacks, args) => {
  callbacks.map((callback) => {
    callback.apply(callback, args)
  })
}

var service = {
  onClose: addListener(onClose),
  onError: addListener(onError),
  publish: publish(createQueue(storage.namespace('publishers'), connect, debug), debug),
  publishIntoExchange: publishIntoExchange(createExchange(storage.namespace('exchangePublishers'), connect, debug), debug),
  consume: consume(createQueue(storage.namespace('consumers'), connect, debug), debug),
  consumeExchange: consumeExchange(createExchange(storage.namespace('exchangeConsumers'), connect, debug), debug)
}

var rabbit = (config) => {
  if (_config === null && (typeof config === 'undefined' || config === null)) {
    throw new Error('Please call rabbit with config first')
  }

  if (config) {
    _config = config
  }

  return service
}

rabbit.middleware = (config) => {
  return middleware(rabbit(config))
}

module.exports = rabbit
