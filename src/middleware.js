module.exports = (rabbit) => {
  return (req, res, next) => {
    req.amqp = {
      publish: rabbit.publish,
      consume: rabbit.consume
    }

    next()
  }
}
