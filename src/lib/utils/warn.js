var warn = (message, error) => {
  console.warn(message, error)
  if (error && error.stack) {
    console.log(error.stack)
  }
}

module.exports = warn
