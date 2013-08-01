describe('dataDepend', function() {

  beforeEach(module('dataDepend'));

  describe('API', function() {

    it('should resolve simple data', inject(function($rootScope, dataDependFactory) {

      // given
      var $data = dataDependFactory.create(),
          loadedFoo;

      // when
      $data.set('foo', function() {
        return 'FOO';
      });

      var status = $data.get('foo', function(foo) {
        loadedFoo = foo;
      });

      // then
      expect(status.$loaded).not.toBe(true);

      // but after
      $rootScope.$digest();

      // then
      expect(loadedFoo).toEqual("FOO");
      expect(status.$loaded).toBe(true);
    }));

    it('should resolve deferred data', inject(function($rootScope, $q, dataDependFactory) {

      // given
      var $data = dataDependFactory.create(),
          deferred = $q.defer(),
          loadedFoo;

      // when
      $data.set('foo', function() {
        return deferred.promise;
      });

      var status = $data.get('foo', function(foo) {
        loadedFoo = foo;
      });

      $rootScope.$digest();

      // first cycle
      // not resolved
      expect(status.$loaded).not.toBe(true);

      deferred.resolve('FOO');

      $rootScope.$digest();

      // second cycle
      // resolved
      expect(status.$loaded).toBe(true);
      expect(loadedFoo).toBe('FOO');
    }));

    it('should update on #changed', inject(function($rootScope, $q, dataDependFactory) {

      // given
      var $data = dataDependFactory.create(),
          setFoo = 'FOO',
          loadedFoo;

      // when
      $data.set('foo', function() {
        return setFoo;
      });

      var status = $data.get('foo', function(foo) {
        loadedFoo = foo;
      });

      $rootScope.$digest();

      // first cycle
      expect(status.$loaded).toBe(true);
      expect(loadedFoo).toBe(setFoo);

      // notify changed foo via #changed
      setFoo = 'BAR';
      $data.changed('foo');

      $rootScope.$digest();

      // second cycle
      expect(status.$loaded).toBe(true);
      expect(loadedFoo).toBe(setFoo);
    }));

    it('should update after #set', inject(function($rootScope, $q, dataDependFactory) {

      // given
      var $data = dataDependFactory.create(),
          loadedFoo;

      // when
      $data.set('bar', 'BAR');

      $data.set('foo', [ 'bar', function(bar) {
        return bar;
      }]);

      var status = $data.get('foo', function(foo) {
        loadedFoo = foo;
      });

      $rootScope.$digest();

      // first cycle
      expect(status.$loaded).toBe(true);
      expect(loadedFoo).toBe('BAR');

      // change bar via #set
      $data.set('bar', 'FOOBAR');

      $rootScope.$digest();

      // second cycle
      expect(status.$loaded).toBe(true);
      expect(loadedFoo).toBe('FOOBAR');
    }));
  });

  describe('data', function() {

    var __dataFactory;

    beforeEach(inject(function(dataProviderFactory) {
      __dataFactory = dataProviderFactory;
    }));

    function createProviderFactory(providers) {

      if (!providers) {
        providers = {};
      }

      return function createProvider(options) {

        options = angular.extend(options, { registry: providers });

        var provider = __dataFactory.create(options);

        providers[options.name] = provider;

        return provider;
      };
    }

    function spyOnFunction(fn) {
      return jasmine.createSpy().andCallFake(fn);
    }

    it('should resolve data using promise', inject(function($rootScope) {

      var createProvider = createProviderFactory();

      var provider = createProvider({
        name: 'foo', 
        factory: function() {
          return 'FOO';
        }
      });

      var value;

      // when
      var getter = provider.resolve();

      // then
      expect(getter.then).toBeDefined();

      getter.then(function(v) {
        value = v;
      });

      // trigger value change
      $rootScope.$digest();

      expect(value).toBe('FOO');
    }));

    it('should resolve dependent data', inject(function($rootScope) {

      var createProvider = createProviderFactory();

      var fooProvider = createProvider({
        name: 'foo', 
        factory: function() {
          return 'FOO';
        }
      });

      var barProvider = createProvider({ 
        name: 'bar', 
        dependencies: ['foo'],
        factory: function(foo) {
          return foo;
        }
      });

      // when
      barProvider.resolve();

      $rootScope.$digest();

      // then
      expect(barProvider.get()).toBe('FOO');
    }));

    it('should resolve dependent data on #set', inject(function($rootScope) {

      var createProvider = createProviderFactory();

      var fooProvider = createProvider({
        name: 'foo', 
        value: 'FOO'
      });

      var barProvider = createProvider({ 
        name: 'bar', 
        dependencies: ['foo'],
        factory: function(foo) {
          return foo;
        }
      });

      // when
      barProvider.resolve();
      $rootScope.$digest();


      fooProvider.set('BAR');
      barProvider.resolve();
      $rootScope.$digest();

      expect(barProvider.get()).toBe('BAR');
    }));

    it('should resolve data via promise', inject(function($rootScope, $q) {

      var createProvider = createProviderFactory();

      var fooDeferred;

      var fooProvider = createProvider({
        name: 'foo', 
        factory: function() {
          fooDeferred = $q.defer();

          return fooDeferred.promise;
        }
      });

      var barProvider = createProvider({ 
        name: 'bar', 
        dependencies: ['foo'],
        eager: true,
        factory: function(foo) {
          return foo;
        }
      });

      // when
      $rootScope.$digest();

      // then
      expect(barProvider.get()).not.toBeDefined();
      expect(fooProvider.get()).not.toBeDefined();

      // but when ...
      fooDeferred.resolve('FOO');
      $rootScope.$digest();

      // then
      expect(barProvider.get()).toBe('FOO');
      expect(fooProvider.get()).toBe('FOO');
    }));

    it('should handle nested dependent data changes (X)', inject(function($rootScope) {

      var createProvider = createProviderFactory();

      var a1Provider = createProvider({
        name: 'a1', 
        value: 'A1'
      });

      var a2Provider = createProvider({
        name: 'a2', 
        value: 'A2'
      });

      var bFactory = spyOnFunction(function (a1, a2) {
        return a1 + '-' + a2;
      });

      var bProvider = createProvider({
        name: 'b',
        dependencies: [ 'a1', 'a2' ], 
        factory: bFactory
      });

      var c1Factory = spyOnFunction(function (b) {
        return b + '-' + 'C1';
      });

      var c1Provider = createProvider({
        name: 'c1', 
        dependencies: [ 'b' ],
        eager: true, 
        factory: c1Factory
      });

      var c2Factory = spyOnFunction(function (b) {
        return b + '-' + 'C2';
      });

      var c2Provider = createProvider({
        name: 'c2', 
        dependencies: [ 'b' ],
        eager: true, 
        factory: c2Factory
      });

      // when (1)
      $rootScope.$digest();

      // then
      expect(bProvider.get()).toBe('A1-A2');
      expect(c1Provider.get()).toBe('A1-A2-C1');
      expect(c2Provider.get()).toBe('A1-A2-C2');

      // validate calls
      expect(bFactory.calls.length).toBe(1);
      expect(c1Factory.calls.length).toBe(1);
      expect(c2Factory.calls.length).toBe(1);

      // when (2)
      a2Provider.set('XX');

      $rootScope.$digest();

      // then
      expect(bProvider.get()).toBe('A1-XX');
      expect(c1Provider.get()).toBe('A1-XX-C1');
      expect(c2Provider.get()).toBe('A1-XX-C2');

      // validate calls
      expect(bFactory.calls.length).toBe(2);
      expect(c1Factory.calls.length).toBe(2);
      expect(c2Factory.calls.length).toBe(2);
    }));

    it('should handle nested dependent data changes (<>)', inject(function($rootScope) {

      var createProvider = createProviderFactory();

      var aProvider = createProvider({
        name: 'a', 
        value: 'A'
      });

      var b1Factory = spyOnFunction(function (a) {
        return a + '-B1';
      });
      
      var b1Provider = createProvider({
        name: 'b1',
        dependencies: [ 'a' ], 
        factory: b1Factory
      });

      var b2Factory = spyOnFunction(function (a) {
        return a + '-B2';
      });

      var b2Provider = createProvider({
        name: 'b2', 
        dependencies: [ 'a' ],
        factory: b2Factory
      });

      var cFactory = spyOnFunction(function (b1, b2) {
        return b1 + '-' + b2;
      });

      var cProvider = createProvider({
        name: 'c', 
        dependencies: [ 'b1', 'b2' ],
        eager: true, 
        factory: cFactory
      });

      // when (1)
      $rootScope.$digest();

      // then
      // validate results
      expect(b1Provider.get()).toBe('A-B1');
      expect(b2Provider.get()).toBe('A-B2');
      expect(cProvider.get()).toBe('A-B1-A-B2');

      // validate calls
      expect(b1Factory.calls.length).toBe(1);
      expect(b2Factory.calls.length).toBe(1);
      expect(cFactory.calls.length).toBe(1);

      // when (2)
      aProvider.set('XX');

      $rootScope.$digest();

      // then
      // validate results
      expect(b1Provider.get()).toBe('XX-B1');
      expect(b2Provider.get()).toBe('XX-B2');
      expect(cProvider.get()).toBe('XX-B1-XX-B2');

      // validate calls
      expect(b1Factory.calls.length).toBe(2);
      expect(b2Factory.calls.length).toBe(2);
      expect(cFactory.calls.length).toBe(2);
    }));

    it('should not call unused data factories', inject(function($rootScope) {

      var createProvider = createProviderFactory();

      var aProvider = createProvider({
        name: 'a', 
        value: 'A'
      });

      var b1Factory = spyOnFunction(function (a) {
        return a + '-B1';
      });
      
      var b1Provider = createProvider({
        name: 'b1',
        dependencies: [ 'a' ], 
        eager: true,
        factory: b1Factory
      });

      var b2Factory = spyOnFunction(function (a) {
        return a + '-B2';
      });

      var b2Provider = createProvider({
        name: 'b2', 
        dependencies: [ 'a' ],
        factory: b2Factory
      });

      // when (1)
      $rootScope.$digest();

      // then
      // validate results
      expect(b1Provider.get()).toBe('A-B1');
      expect(b2Provider.get()).not.toBeDefined();

      // validate calls
      expect(b1Factory.calls.length).toBe(1);
      expect(b2Factory.calls.length).toBe(0);

      // when (2)
      aProvider.set('XX');

      $rootScope.$digest();

      // then
      // validate results
      expect(b1Provider.get()).toBe('XX-B1');
      expect(b2Provider.get()).not.toBeDefined();

      // validate calls
      expect(b1Factory.calls.length).toBe(2);
      expect(b2Factory.calls.length).toBe(0);
    }));
   
    it('should throw error when setting value on factory defined provider', inject(function($rootScope) {

      var createProvider = createProviderFactory();
      
      var fooProvider = createProvider({
        name: 'foo',
        eager: true,
        factory: function (a) {
          return 'FOO';
        }
      });

      expect(function() {
        fooProvider.set('BAR');
      }).toThrow
    })); 
  });
});