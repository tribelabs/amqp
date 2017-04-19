var isPlainObject = require('is-plain-obj')
var isCallable = require('is-callable')

var map = function (consumers) {
  var self = this

  if (isPlainObject(consumers)) {
    consumers = Object.keys(consumers).map((name) => {
      var value = consumers[name]
      if (isPlainObject(value)) {
        return Object.assign({}, value, {
          name: name
        })
      }

      if (isCallable(value) || Array.isArray(value)) {
        return Object.assign({
          name: name,
          consumer: value
        })
      }

      return null
    })
    .filter((value) => {
      var isOk = !!value
      if (!isOk) {
        console.warn('Invalid def of', value)
      }

      return isOk
    })
  }

  if (Array.isArray(consumers)) {
    return consumers.map((def) => {
      if (def.type === 'exchange') {
        return self.consumeExchange(def.name, def.consumer, def.opts)
      }

      return self.consume(def.name, def.consumer, def.opts)
    })
  } else {
    throw new Error('Consumers has to be array of plain object')
  }
}

module.exports = map
