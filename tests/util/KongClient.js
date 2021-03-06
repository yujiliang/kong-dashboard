var request = require('../../lib/request');
var semver = require('semver');

var Kong = {

  /**
   * Returns a promise that will resolve with all Services being deleted
   */
  deleteAllServices: function() {
    if (semver.lt(process.env.KONG_VERSION, '0.13.0')) {
      return Promise.resolve(0); // first introduced in 0.13.0
    }
    // A service can't be deleted if a route references it.
    return this.deleteAllRoutes().then(() => {
      return this.deleteAllObjectsOfType('services');
    });
  },

  /**
   * Returns a promise that will resolve with all Routes being deleted
   */
  deleteAllRoutes: function() {
    if (semver.lt(process.env.KONG_VERSION, '0.13.0')) {
      return Promise.resolve(0); // first introduced in 0.13.0
    }
    return this.deleteAllObjectsOfType('routes');
  },

  /**
   * Returns a promise that will resolve with all APIs being deleted
   */
  deleteAllAPIs: function() {
    if (semver.gte(process.env.KONG_VERSION, '0.15.0')) {
      return Promise.resolve(0); // legacy since 0.15.0
    }
    return this.deleteAllObjectsOfType('apis');
  },

  /**
   * Returns a promise that will resolve with all Plugins being deleted
   */
  deleteAllPlugins: function() {
    return this.deleteAllObjectsOfType('plugins');
  },

  /**
   * Returns a promise that will resolve with all Consumers being deleted
   */
  deleteAllConsumers: function() {
    return this.deleteAllObjectsOfType('consumers');
  },

  /**
   * Returns a promise that will resolve with all Certificates being deleted
   */
  deleteAllCertificates: function() {
    return this.deleteAllObjectsOfType('certificates');
  },

  /**
   * Returns a promise that will resolve with all Upstreams being deleted
   */
  deleteAllUpstreams: function() {
    return this.deleteAllObjectsOfType('upstreams');
  },

  /**
   * Returns a promise that will resolve with all Objects of type objectType being deleted
   */
  deleteAllObjectsOfType: function(objectType) {
    return request.get('http://127.0.0.1:8001/' + objectType).then((response) => {
      var body = JSON.parse(response.body);
      var promise = new Promise((resolve, reject) => {
        resolve();
      });
      body.data.forEach((object) => {
        promise = promise.then(() => {
          return request.delete('http://127.0.0.1:8001/' + objectType + '/' + object.id);
        });
      });

      if (body.total > body.data.length) {
        promise = promise.then(() => {
          return this.deleteAllObjectsOfType(objectType);
        });
      }

      return promise;
    });
  },

  /**
   * Returns a promise that will resolve with the first Service registered in Kong.
   */
  getFirstService: () => {
    return request.get('http://127.0.0.1:8001/services').then((response) => {
      var services = JSON.parse(response.body).data;
      return services.length > 0 ? services[0] : null;
    });
  },

  /**
   * Returns a promise that will resolve with the first API registered in Kong.
   */
  getFirstAPI: () => {
    return request.get('http://127.0.0.1:8001/apis').then((response) => {
      var apis = JSON.parse(response.body).data;
      return apis.length > 0 ? apis[0] : null;
    });
  },

  /**
   * Returns a promise that will resolve with the first API registered in Kong.
   */
  getFirstCertificate: () => {
    return request.get('http://127.0.0.1:8001/certificates').then((response) => {
      var certificates = JSON.parse(response.body).data;
      return certificates.length > 0 ? certificates[0] : null;
    });
  },

  /**
   * Returns a promise that will resolve with the first plugin registered in Kong.
   */
  getFirstPlugin: () => {
    return request.get('http://127.0.0.1:8001/plugins').then((response) => {
      var plugins = JSON.parse(response.body).data;
      return plugins.length > 0 ? plugins[0] : null;
    });
  },

  /**
   * Returns a promise that will resolve with the plugin whose ID is <id>
   */
  getPluginById: (id) => {
    return request.get('http://127.0.0.1:8001/plugins/' + id).then((response) => {
      return JSON.parse(response.body);
    });
  },

  /**
   * Returns a promise that will resolve with the service whose ID is <id>
   */
  getServiceById: (id) => {
    return request.get('http://127.0.0.1:8001/services/' + id).then((response) => {
      return JSON.parse(response.body);
    });
  },

  /**
   * Returns a promise that will resolve with the upstream whose ID is <id>
   */
  getUpstreamById: (id) => {
    return request.get('http://127.0.0.1:8001/upstreams/' + id).then((response) => {
      return JSON.parse(response.body);
    });
  },

  /**
   * Returns a promise that will resolve with a plugin being created.
   */
  createPlugin: (data) => {
    return request.post('http://127.0.0.1:8001/plugins', data).then((response) => {
      return response.body;
    });
  },

  /**
   * Returns a promise that will resolve with a consumer being created.
   */
  createConsumer: (data) => {
    return request.post('http://127.0.0.1:8001/consumers', data).then((response) => {
      return response.body;
    });
  },

  /**
   * Returns a promise that will resolve with the creation of a Service.
   */
  createService: (data) => {
    return request.post('http://127.0.0.1:8001/services', data).then((response) => {
      return response.body;
    });
  },

  /**
   * Returns a promise that will resolve with the creation of a Route.
   */
  createRoute: (data) => {
    return request.post('http://127.0.0.1:8001/routes', data).then((response) => {
      return response.body;
    });
  },

  /**
   * Returns a promise that will resolve with the creation of an API.
   */
  createAPI: (data) => {
    return request.post('http://127.0.0.1:8001/apis', data).then((response) => {
      return response.body;
    });
  },

  /**
   * Returns a promise that will resolve with the creation of basic auth credentials for the consumer.
   */
  createBasicAuthCreds: (consumer, username, password) => {
     return request.post('http://127.0.0.1:8001/consumers/' + consumer.id + '/basic-auth', {
       username: username,
       password: password
     }).then((response) => {
      return response.body;
    });
  },

  /**
   * Returns a promise that will resolve with the creation of key auth credentials for the consumer.
   */
  createKeyAuthCreds: (consumer, key) => {
    return request.post('http://127.0.0.1:8001/consumers/' + consumer.id + '/key-auth', {key: key}).then((response) => {
      return response.body;
    });
  },

  /**
   * Returns a promise that will resolve with the creation of an upstream object.
   */
  createUpstream: (name) => {
    return request.post('http://127.0.0.1:8001/upstreams', {name: name}).then((response) => {
      return response.body;
    });
  }
};

module.exports = Kong;
