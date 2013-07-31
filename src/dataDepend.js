(function(angular) {
  
  function createBinding(angular) {

    var module = angular.module('dataDepend', []);

    var isArray = angular.isArray, 
        isFunction = angular.isFunction,
        isObject = angular.isObject,
        forEach = angular.forEach,
        extend = angular.extend;

    function ensureArray(elements) {
      if (!isArray(elements)) {
        return [ elements ];
      } else {
        return elements;
      }
    }

    var dataFactory = [ '$rootScope', '$q', function($rootScope, $q) {
      
      function createFactory(nextTick) {

        function create(options) {
          
          options = options || {};

          var registry = options.registry,
              dependencies = options.dependencies || [],
              name = options.name,
              factory = options.factory, 
              resolve = options.resolve || false;

          var loadPromise;

          var provider = { },
              changed = true,
              dirty = true;

          // parent values
          var parentValues = { };

          var children = provider.children = [],
              parents = { };

          forEach(dependencies, function(dependency) {
            var p = getProvider(dependency);
            p.children.push(provider);
          });

          function getProvider(key) {
            var providers = registry.providers,
                provider = providers[key];
            
            if (!provider) {
              throw new Error('[dataDepend] No provider for ' + key);
            }

            return provider;
          }

          function allChildren(fn) {
            forEach(children, fn);
          }

          function resolveDependencies() {
            var promises = [];

            forEach(dependencies, function(d) {
              var provider = getProvider(d);

              var promise = provider.get().then(function(value) {

                var oldValue = parentValues[d];
                if (oldValue != value) {
                  parentValues[d] = value;
                  changed = true;
                }

                return value;
              });

              promises.push(promise);
            });

            return promises;
          }

          function asyncLoad(reload) {
            provider.$loaded = dirty = false;

            var promise = $q.all(resolveDependencies()).then(function(values) {

              if (changed || reload) {
                provider.value = factory.apply(factory, values);
              }

              provider.$loaded = true;
              changed = false;

              loadPromise = null;

              allChildren(function(child) {
                child.parentChanged();
              });

              return provider.value;
            });

            return promise;
          }

          function parentChanged() {
            
            // anticipating parent change, everything ok
            if (loadPromise) {
              return;
            }

            dirty = true;

            allChildren(function(child) {
              child.parentChanged();
            });

            // should this data be resolved if dirty
            if (resolve) {
              get();
            }
          }

          function get(options) {
            var reload = (options || {}).reload;

            if (dirty || reload) {
              loadPromise = asyncLoad(reload);
            }

            if (loadPromise) {
              return loadPromise;
            } else {
              return $q.when(provider.value);
            }
          }

          function set(value) {

          }

          if (resolve) {
            get();
          } 

          // provider item produced by factory
          return extend(provider, {
            get: get, 
            set: set,
            parentChanged: parentChanged
          });
        };

        // factory
        return {
          create: create
        };
      }

      return createFactory(function(fn) {
        $rootScope.$evalAsync(fn);
      });
    }];

    var dataDependFactory = [ '$rootScope', '$q', '$injector', function($rootScope, $q, $injector) {

      var annotate = $injector.annotate;

      function createFactory(nextTick) {

        function create() {

          var providers = {};

          function get(variables, callback) {

          }

          function set(name, value) {
            
          }

          function changed(name) {

          }

          return {
            $providers: providers, 

            get: get,
            set: set,
            changed: changed
          };
        }

        return {
          create: create
        };
      }

      return createFactory(function(fn) {
        $rootScope.$evalAsync(fn);
      });
    }];

    module.factory('dataDependFactory', dataDependFactory);
    module.factory('dataFactory', dataFactory);

    return module;
  }

  if (typeof define === "function" && define.amd) {
    define([ "angular" ], function(angular) {
      return createBinding(angular);
    });
  } else
  if (typeof angular !== undefined) {
    createBinding(angular);
  } else {
    throw new Error("Cannot bind dataDepend: AngularJS not available on window or via AMD");
  }
})(angular);