module.exports = (rabbit) => {
  return (req, res, next) => {
    req.amqp = {
      publish: rabbit.publish,
      publishIntoExchange: rabbit.publishIntoExchange,
      consume: rabbit.consume,
      consumeExchange: rabbit.consumeExchange
    }

    next()
  }
}
