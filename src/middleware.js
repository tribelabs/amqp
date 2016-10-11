module.exports = (rabbit) => {
  return (req, res, next) => {
    req.amqp = {
      publish: function (queue, message) {
        return rabbit.publish(queue, message)
      },

      consume: function (queue, callback) {
        return rabbit.consume(queue, callback)
      }
    }

    next()
  }
}
