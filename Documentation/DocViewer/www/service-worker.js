/* global self, console, clients, caches, fetch */
'use strict';
var app = {TEMPLATE: "JSKIT_APP"};
var cacheKey = 'build-' + app.buildId;
var urlPrefix = self.location.protocol + '//' + self.location.host + '/';

var install = function(){
  var loaded = 0;
  var total = app.sources.length;
  return clients.matchAll({includeUncontrolled: true}).then(function(clients){
    var client = clients[0];
    return caches.open(cacheKey).then(function(cache){
      return Promise.all(app.sources.map(function(source){
        return cache.add(source).then(function(){
          ++loaded;
          client.postMessage({type: 'progress', loaded: loaded, total: total});
        });
      }));
    });
  });
};

var activate = function(){
  return clients.claim().then(cleanup);
};

var cleanup = function(){
  return caches.keys().then(function(keys){
    return Promise.all(keys.map(function(key){
      if (key.startsWith('build-') && key != cacheKey){
        console.debug('Deleting ' + key + '...');
        return caches.delete(key);
      }
    }));
  });
};

var cacheFetch = function(request){
  return caches.match(request, {cacheName: cacheKey}).then(function(response){
    if (response){
      return response;
    }
    if (request.method == "GET" && request.url.startsWith(urlPrefix)){
      console.debug("Fetching " + request.url);
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
    return fetch(request);
  });
};

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
  event.respondWith(cacheFetch(event.request));
});

self.addEventListener('message', function(event){
  if (event.data.type == 'activate'){
    console.log('Client message to activate ' + cacheKey);
    self.skipWaiting();
  }
});