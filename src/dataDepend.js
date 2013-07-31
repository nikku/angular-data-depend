(function(angular) {
  
  function createBinding(angular) {

    var module = angular.module('dataDepend', []);

    var isArray = angular.isArray, 
        isFunction = angular.isFunction,
        isObject = angular.isObject,
        forEach = angular.forEach,
        annotate = $injector.annotate;

    function toArray(arrayLike) {
      return Array.prototype.slice.call(arrayLike);
    }

    function ensureArray(elements) {
      if (!isArray(elements)) {
        return [ elements ];
      } else {
        return elements;
      }
    }

    var dataFactory = [ '$rootScope', '$q', '$injector', function($rootScope, $q, $injector) {

      function createFactory(nextTick) {

        function create($parent) {
          
          function getProvider(key) {
            var provider = providers[key];
            if (!provider) {
              throw new Error('[dataDepend] No provider for ' + key);
            }

            return provider;
          }

          function getProviders(keys) {
            var providers = [];

            forEach(keys, function(key) {
              providers.push(getProvider(key));
            });

            return providers;
          }

          var providers = $parent.providers;

          function get(options) {
            var reload = (options || {}).reload;

            if (reload) {
              $q.all()
            }
          }

          function set(value) {

          }
        }

        return {
          create: create
        };
      }

      return createFactory(function(fn) {
        $rootScope.$evalAsync(fn);
      });
    }];

    var dataDependFactory = [ '$rootScope', '$q', '$injector', function($rootScope, $q, $injector) {

      function createFactory(nextTick) {

        function create() {

          var providers = {};

          function getProviders(keys) {
            var providers = [];

            forEach(keys, function(key) {
              providers.push(getProvider(key));
            });

            return providers;
          }

          function getProvider(key) {
            var provider = providers[key];
            if (!provider) {
              throw new Error('[dataDepend] No provider for ' + key);
            }

            return provider;
          }

          function getProviders(keys) {
            var providers = [];

            forEach(keys, function(key) {
              providers.push(getProvider(key));
            });

            return providers;
          }

          function get(variables, callback) {

            var depends = ensureArray(variables),
                dependsProviders = getProviders(depends), 
                provider = {};

            forEach(depends, function(d) {
              var p = getProvider(d);

              dependsProviders.push(p);
              p.dependencies.push(provider);
            });

            function loaded() {

            }
            
            function internalReload() {
              var promise = $q.all(collectDependencies(dependsProviders)).then(function() {
                var args = toArray(arguments);

                var newValue = callback.apply(args);

                if (newValue !== oldValue) {
                  provider.value = newValue;
                }

                provider.loaded = true;
                delete provider.loading;

                if (provider.reload) {
                  reload();
                }
              });
            }

            function internalGet() {
              return $q.when(provider.loading || provider.value);
            }

            function reload() {
              if (!provider.loading) {
                provider.loaded = provider.reload = false;
                provider.loading = internalReload();
              }

              return provider.loading;
            }

            function reset() {
              provider.handle.loaded = false;
              provider.value = null;

              if (provider.resolve) {
                nextTick(function() {

                });
              }
            };

            provider.unbind = unbind;
            provider.invalidate = invalidate;

            return provider.handle;
          }

          function set(name, value) {
            var dependencies;

            if (angular.isFunction(value) ||
                angular.isArray(value)) {

              dependencies = annotate(value);
            } else {
              value = (function(val) {
                return function() {
                  return val;
                };
              })(value);
            }
          }

          return {
            $data: data, 

            get: get,
            set: set
          };
        }

        return {
          create: create;
        };
      }

      return createFactory(function(fn) {
        $rootScope.$evalAsync(fn);
      });
    }];

    module.factory('dataDependFactory', dataDependFactory);

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