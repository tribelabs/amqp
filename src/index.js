var amqp = require('amqplib')

var middleware = require('./middleware.js')
var publish = require('./lib/publish.js')
var consume = require('./lib/consume.js')
var createChannel = require('./lib/createChannel.js')

var _config = null

var connection = null
var connect = () => {
  if (!connection) {
    connection = new Promise((resolve, reject) => {
      debug('Create new rabbit connection', _config)
      resolve(amqp.connect(_config.connection))
    })
  }

  return connection
}

var publishers = {}
var consumers = {}

var debug = function () {
  if (_config.debug === true) {
    console.log.apply(null, arguments)
  }
}

var service = {
  publish: publish(createChannel(publishers, connect, debug), debug),
  consume: consume(createChannel(consumers, connect, debug), debug)
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
