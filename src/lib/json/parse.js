module.exports = (string) => {
  try {
    return JSON.parse(string)
  } catch (e) {
    console.log('Parsing of json has failed', e)
    return ''
  }
}
