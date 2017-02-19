var isNil = require('is-nil')

var stringify = require('../json/stringify.js')

module.exports = (message) => {
  if (isNil(message)) {
    message = new Buffer(stringify({}))
  } else {
    message = new Buffer(stringify(message))
  }

  return message
}
