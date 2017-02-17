module.exports = (connect) => {
  return connect()
  .then((conn) => {
    return conn.createChannel()
  })
}
