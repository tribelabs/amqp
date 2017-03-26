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
  },

  clear: () => {
    Object.keys(storage).map((namespace) => {
      storage[namespace] = {}
    })
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

  namespacedService.unset = () => {
    delete storage[namespace][_name]
    return namespacedService
  }

  return namespacedService
}

module.exports = service
