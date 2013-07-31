describe('instanceData service', function() {


  it('should provide data', inject(function($rootScope, $q) {

    var instanceData = createInstanceData();

    // provide data using promise
    instanceData.provide('foo', function() {

      var defered = $q.defer();

      setTimeout(function(){
        defered.resolve('FOO');
      }, 500);

      return defered.promise;
    });

    // provide data using value
    instanceData.provide('bar', function() {
      return "BAR";
    });

    // provide data depending on other data
    instanceData.provide('bar', [ 'foo' ], function(foo) {
      return "FOOBAR";
    });
  }));

  it('should serve data', inject(function($rootScope, $q) {

    var instanceData = createInstanceData();

    // provide data using promise
    var foo = instanceData.get('foo', function(foo) {

      alert(foo);
      // or update current scope
    });

    // true or false depending on load state
    foo.$loaded;

    // provide data using promise
    var complex = instanceData.get([ 'foo', 'bar', 'asdf', function(foo, bar, asdf) {

      alert(foo + bar + asdf);
      // or update current scope
    });

    // true or false depending on load state of ALL requirements
    complex.$loaded;
  }));

  it('should update data bindings', inject(function($rootScope, $q) {

    // given
    var instanceData = createInstanceData();

    // provide data depending on other data
    instanceData.provide('foo', function(foo) {
      return "FOO";
    });

    // provide data depending on other data
    instanceData.provide('bar', [ 'foo' ], function(foo) {
      return "FOOBAR";
    });

    instanceData.invalidate('foo');
  }));

  it('should be embeddable in controller', inject(function($rootScope, $q) {

    var controller = function ($scope, instanceDataFactory) {

      // shortcut api
      $scope.complexObject = instanceDataFactory.create('complexObject', {
        foo: function() {

        },

        bar: ['foo', function(foo) {

        }]
      });

      // simple api
      $scope.complexObject = instanceDataFactory.create('complexObject');

      $scope.complexObject.provide('foo', function () {

        deferred = $q.defer();

        // $http.get(...).then(function(response) {  })
        // or
        // return $http.get(...)

        return deferred.promise;

      });

      $scope.foo = $scope.complexObject.get('foo', function(foo) {
        // do stuff with foo
      });
    };

    var childController = function ($scope) {

      // assume 
      //  $scope.complexObject is set

      $scope.foo = $scope.complexObject.get('foo', function(foo) {
        // do stuff with foo
      });
    };
  }));
});