var amqp = require('amqplib')

var middleware = require('./middleware.js')
var publish = require('./lib/publish.js')
var publishIntoExchange = require('./lib/publishIntoExchange.js')
var consumeBuilder = require('./lib/consume.js')
var consumeExchangeBuilder = require('./lib/consumeExchange.js')
var storage = require('./lib/storage.js')
var createQueue = require('./lib/createQueue.js')
var createExchange = require('./lib/createExchange.js')
var map = require('./lib/map.js')

var warn = require('./lib/utils/warn.js')
var instanceOfString = require('./lib/utils/instanceOfString.js')
var instanceofError = require('./lib/utils/instanceofError.js')

var _config = null

var connection = null
var connected = false
var reconnection = false

var connect = () => {
  if (!connection) {
    connection = new Promise((resolve, reject) => {
      debug('Create new rabbit connection', _config)

      amqp
      .connect(_config.connection)
      .then((model) => {
        connected = true

        model.on('close', () => {
          debug('"Close" event emitted, emitting callbacks:', onClose.length)
          connection = null
          connected = false
          reconnection = true
          emitListeners(onClose, [model])
        })

        model.on('error', (error) => {
          debug('"Error" event emitted, emitting callbacks:', onError.length)
          connection = null
          connected = false
          reconnection = true
          emitListeners(onError, [error, model])
        })

        if (reconnection) {
          debug('Reconnecting..., add consumers')
          consumers.map((args) => {
            consume.apply(null, args)
          })

          exchangeConsumers.map(function (args) {
            consumeExchange.apply(null, args)
          })
        }

        resolve(model)
      })
      .catch((error) => {
        connection = null
        connected = false

        warn('AMQP connect failed', error)

        reject(error)
      })
    })
  }

  return connection
}

var debug = function () {
  var mode = debug.mode()
  var args = ['[AMQP]'].concat(...arguments)

  if (args.length) {
    if (mode === 'all') {
      console.log(...args)
    } else if (mode === 'tiny') {
      args = args.filter((arg) => {
        return instanceOfString(arg) || instanceofError(arg)
      })
      console.log(...args)
    }
  }
}

debug.mode = () => {
  var mode = (_config || {}).debug

  if (mode === true) {
    mode = 'all'
  }

  if (!mode || ['all', 'tiny'].indexOf(mode) === -1) {
    mode = false
  }

  return mode
}

debug.isAllowed = () => {
  return !!debug.mode()
}

var onClose = []
var onError = []

var addListener = (listeners) => {
  if (!Array.isArray(listeners)) {
    throw new Error('Listeners listeners has to be array')
  }

  return (callbacks) => {
    if (callbacks) {
      if (!Array.isArray(callbacks)) {
        callbacks = [callbacks]
      }

      callbacks.map((callback) => {
        if (typeof callback !== 'function') {
          throw new Error('Callback has to be function')
        }

        listeners.push(callback) // would rather use .concat but later...
      })
    }
  }
}

var emitListeners = (callbacks, args) => {
  try {
    callbacks.map((callback) => {
      callback.apply(callback, args)
    })
  } catch (e) {
    warn('Error in listeners spotted', e)
  }
}

var consume = consumeBuilder(createQueue(storage.namespace('consumers'), connect, debug), debug)
var consumeExchange = consumeExchangeBuilder(createExchange(storage.namespace('exchangeConsumers'), connect, debug), debug)

var consumers = []
var consumeWrapper = function () {
  var args = arguments
  consumers.push(args)
  return consume(...args)
}

var exchangeConsumers = []
var exchangeWrapper = function () {
  var args = arguments
  exchangeConsumers.push(args)
  return consumeExchange(...args)
}

var service = {
  connect: connect,
  isConnected: () => {
    return connected
  },
  onClose: addListener(onClose),
  onError: addListener(onError),
  publish: publish(createQueue(storage.namespace('publishers'), connect, debug), debug),
  publishIntoExchange: publishIntoExchange(createExchange(storage.namespace('exchangePublishers'), connect, debug), debug),
  consume: consumeWrapper,
  consumeExchange: exchangeWrapper,
  map: map
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

var clear = () => {
  storage.clear()
}

var timeoutId = null
var reconnectTimeout = () => {
  timeoutId = setTimeout(() => {
    connect()
    .then(() => {
      if (!connected) { // should not be the case, but...
        reconnectTimeout()
      } else {
        clearTimeout(timeoutId)
      }
    })
    .catch(() => {
      reconnectTimeout()
    })
  }, 5000)
}

var reconnect = () => {
  reconnectTimeout()
}

service.onError([clear, reconnect])
service.onClose([clear, reconnect])

rabbit.middleware = (config) => {
  return middleware(rabbit(config))
}

module.exports = rabbit
