var isPlainObject = require('is-plain-obj')
var isCallable = require('is-callable')

var map = function (consumers) {
  if (isPlainObject(consumers)) {
    var temp = consumers
    consumers = []

    Object.keys(temp).map((name) => {
      var value = temp[name]
      var def = null

      if (isPlainObject(value)) {
        def = Object.assign({}, value, {
          name: name
        })
      }

      if (isCallable(value) || Array.isArray(value)) {
        def = Object.assign({
          name: name,
          consumer: value
        })
      }

      if (def) {
        consumers.push(def)
      }
    })
  }

  if (Array.isArray(consumers)) {
    return consumers.map((def) => {
      if (def.type === 'exchange') {
        return this.consumeExchange(def.name, def.consumer, def.opts)
      }

      return this.consume(def.name, def.consumer, def.opts)
    })
  }

  throw new Error('Consumers has to be array of plain object')
}

module.exports = map
