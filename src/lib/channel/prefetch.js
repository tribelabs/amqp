module.exports = (debug) => {
  return (channel, value) => {
    var prefetch = value === true ? 1 : Number(value)

    return channel.prefetch(prefetch)
    .then(() => {
      return channel
    })
  }
}
