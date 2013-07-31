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

    var dataProviderFactory = [ '$rootScope', '$q', function($rootScope, $q) {
      
      function createFactory(nextTick) {

        function create(options) {
          
          options = options || {};

          var name = options.name,
              registry = options.registry,
              dependencies = options.dependencies || [],
              factory = options.factory, 
              eager = options.eager || false;

          var parentValues = {},
              children = [],
              changed = true,
              dirty = true,
              loading = null,
              data = { $loaded: false };

          // element produced by 
          // the factory
          var provider = {
            name: name,
            data: data,
            get: get, 
            set: set,
            resolve: resolve,
            children: children, 
            parentChanged: parentChanged
          };

          allDependenciesDo(function(d) {
            getProvider(d).children.push(provider);
          });

          if (eager) {
            nextTick(function() {
              resolve();
            });
          }

          if (!factory) {
            setLoaded(options.value);
          }

          function setLoaded(v) {
            data.value = v;
            data.$loaded = true;
            changed = false;

            allChildrenDo(function(child) {
              child.parentChanged();
            });
          }

          function setLoading() {
            data.$loaded = false;
            dirty = false;
          }

          function getProvider(key) {
            var providers = registry.providers,
                provider = providers[key];
            
            if (!provider) {
              throw new Error('[dataDepend] No provider for ' + key);
            }

            return provider;
          }

          function allChildrenDo(fn) {
            forEach(children, fn);
          }

          function allDependenciesDo(fn) {
            forEach(dependencies, fn);
          }

          function resolveDependencies() {
            var promises = [];

            allDependenciesDo(function(d) {
              var provider = getProvider(d);

              var promise = provider.resolve().then(function(value) {

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
            setLoading();

            var promise = $q.all(resolveDependencies()).then(function(values) {

              var value = get();

              if (changed || reload) {
                if (factory) {
                  value = factory.apply(factory, values);
                }
              }

              return value;
            }).then(function(value) {
              if (loading === promise) {
                loading = null;
              }

              setLoaded(value);

              return value;
            });

            return promise;
          }

          /**
           * Receive a notification from the parent that it got changed
           * and update your state accordingly.
           *
           */
          function parentChanged() {
            
            // anticipating parent change, everything ok
            if (loading) {
              return;
            }

            dirty = true;

            // should this provider resolve its data 
            // eagerly if it got dirty
            if (eager) {
              nextTick(function() {
                resolve();
              });
            }

            allChildrenDo(function(child) {
              child.parentChanged();
            });
          }

          function get() {
            return data.value;
          }

          /**
           * Resolve the value of this data holder
           */
          function resolve(options) {
            var reload = (options || {}).reload;

            if (dirty || reload) {
              loading = asyncLoad(reload);
            }

            if (loading) {
              return loading;
            } else {
              return $q.when(get());
            }
          }

          function set(value) {
            if (factory) {
              throw new Error("[dataDepend] Cannot set value, was using factory");
            }

            setLoaded(value);
          }

          return provider;
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
    module.factory('dataProviderFactory', dataProviderFactory);

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