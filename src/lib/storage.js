var storage = {}

var getNamespace = (namespace) => {
  if (!storage[namespace]) {
    storage[namespace] = {}
  }

  return storage[namespace]
}

var service = {
  get: (namespace, name) => {
    return getNamespace(namespace)[name]
  },

  namespace: (namespace) => {
    return namespacedServiceBuilder(namespace)
  }
}

var namespacedServiceBuilder = (namespace) => {
  var _name = null
  var namespacedService = (name) => {
    _name = name
    return service.get(namespace, name)
  }

  namespacedService.set = (value) => {
    storage[namespace][_name] = value
    return namespacedService
  }

  return namespacedService
}

module.exports = service