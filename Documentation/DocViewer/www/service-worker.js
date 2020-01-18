/* global self, console, clients, caches, fetch */
'use strict';
var app = {TEMPLATE: "JSKIT_APP"};
var cacheKey = 'build-' + app.buildId;
var baseURL = self.location.href.substr(0, self.location.href.lastIndexOf('/') + 1);
var bootstrapperURL = baseURL + 'HTMLAppBootstrapper.js';

function install(){
  var required = [];
  var source;
  for (var path in app.sources){
    source = app.sources[path];
    if (source.required){
      required.push(path);
    }
  }
  var loaded = 0;
  var total = required.length;
  return clients.matchAll({includeUncontrolled: true}).then(function(clients){
    var client = clients[0];
    return caches.open(cacheKey).then(function(cache){
      return Promise.all(required.map(function(path){
        return cache.add(path).then(function(){
          ++loaded;
          client.postMessage({type: 'progress', loaded: loaded, total: total});
        });
      }));
    });
  });
}

function activate(){
  return clients.claim().then(cleanup);
}

function cleanup(){
  return caches.keys().then(function(keys){
    return Promise.all(keys.map(function(key){
      if (key.startsWith('build-') && key != cacheKey){
        console.debug('Deleting ' + key + '...');
        return caches.delete(key);
      }
    }));
  });
}

function fetchFromCache(request){
  return caches.match(request, {cacheName: cacheKey}).then(function(response){
    if (response){
      return response;
    }
    if (isNonRequiredSourceRequest(request)){
      return fetchAndAddToCache(request);
    }
    return fetch(request);
  });
}

function fetchFromServer(request){
  console.debug('Fetching ' + request.url + ' from server');
  return fetch(request, {cache: 'no-cache'}).then(function(response){
    if (response.ok){
      return response;
    }
    console.debug('Server response not ok for ' + request.url + ', using cache');
    return caches.match(request);
  }, function(){
    console.debug('No server response for ' + request.url + ', using cache');
    return caches.match(request);
  });
}

function fetchAndAddToCache(request){
  console.debug('Adding ' + request.url + ' to cache');
  return fetch(request, {cache: 'no-store'}).then(function(response){
    if (response.ok){
      caches.open(cacheKey).then(function(cache){
        cache.put(request, response).then(function(){
          console.debug("Cached " + request.url);
        }, function(){
          console.error("Error caching " + request.url);
        });
      });
      return response.clone();
    }
    return response;
  });
}

function isBootstrapRequest(request){
  if (request.method != "GET"){
    return false;
  }
  if (request.url == baseURL){
    return true;
  }
  if (request.url == bootstrapperURL){
    return true;
  }
  return false;
}

function isNonRequiredSourceRequest(request){
  if (request.method != "GET"){
    return false;
  }
  if (request.url.startsWith(baseURL)){
    var path = request.url.substr(baseURL.length);
    if (path === ''){
      path = './';
    }
    return path in app.sources;
  }
  return false;
}

self.addEventListener('install', function(event){
  console.debug('Installing ' + cacheKey + '...');
  event.waitUntil(install().catch(function(error){
    console.log('Install Error');
    console.error(error);
    return clients.matchAll({includeUncontrolled: true}).then(function(clients){
      clients[0].postMessage({type: 'error', message: error.toString()});
    }).then(function(){
      throw error;
    });
  }));
});

self.addEventListener('activate', function(event){
  console.debug('Activating ' + cacheKey + '...');
  event.waitUntil(activate().catch(function(error){
    console.log('Activate Error');
    console.error(error);
    throw error;
  }));
});

self.addEventListener('fetch', function(event){
  var request = event.request;
  if (isBootstrapRequest(request)){
    event.respondWith(fetchFromServer(request));
  }else{
    event.respondWith(fetchFromCache(request));
  }
});

self.addEventListener('error', function(event){
  console.log('Error');
  console.log(event);
});

self.addEventListener('message', function(event){
  if (event.data.type == 'activate'){
    console.log('Client message to activate ' + cacheKey);
    self.skipWaiting();
  }
});