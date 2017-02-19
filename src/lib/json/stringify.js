module.exports = (value) => {
  try {
    return JSON.stringify(value)
  } catch (e) {
    console.warn('JSON encoding failed, returning empty string', e)
    return ''
  }
}
