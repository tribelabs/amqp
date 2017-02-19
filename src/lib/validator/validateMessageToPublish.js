var isNil = require('is-nil')

module.exports = (message) => {
  if (isNil(message)) {
    message = new Buffer(JSON.stringify({}))
  } else {
    message = new Buffer(JSON.stringify(message))
  }

  return message
}
