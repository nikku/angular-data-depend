describe('dataDepend', function() {

  beforeEach(module('dataDepend'));

/*  describe('API', function() {

    it('should offer #set', inject(function(dataDependFactory) {

      // given
      var $data = dataDependFactory.create();

      // then
      expect($data.set).toBeDefined();
    }));

    it('should offer #get', inject(function(dataDependFactory) {

      // given
      var $data = dataDependFactory.create();

      // then
      expect($data.get).toBeDefined();
    }));

    if ('should offer #changed', inject(function(dataDependFactory) {

      // given
      var $data = dataDependFactory.create();

      // then
      expect($data.changed).toBeDefined();
    }));
  });

  describe('functionality', function() {

    it('should set simple data', inject(function($rootScope, dataDependFactory) {

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

    it('should set deferred data', inject(function($rootScope, $q, dataDependFactory) {

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

    it('should update changed data via #changed', inject(function($rootScope, $q, dataDependFactory) {

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

    it('should update changed data via #set', inject(function($rootScope, $q, dataDependFactory) {

      // given
      var $data = dataDependFactory.create(),
          loadedFoo;

      // when
      $data.set('foo', [ 'bar', function(bar) {
        return bar;
      }]);

      $data.set('bar', 'BAR');

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
  });*/


  describe('data', function() {

    var __dataFactory;

    beforeEach(inject(function(dataFactory) {
      __dataFactory = dataFactory;
    }));

    function createProviderFactory(dataDepend) {

      if (!dataDepend) {
        dataDepend = { providers: {} };
      }

      return function createProvider(options) {

        options = angular.extend(options, { registry: dataDepend });

        var provider = __dataFactory.create(options);

        dataDepend.providers[options.name] = provider;

        return provider;
      };
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

    it('should resolve dependent data', inject(function($rootScope, dataFactory) {

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

    it('should update dependent data on #set', inject(function($rootScope, dataFactory) {

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

      var bProvider = createProvider({
        name: 'b',
        dependencies: [ 'a1', 'a2' ], 
        factory: function (a1, a2) {
          return a1 + '-' + a2;
        }
      });

      var c1Provider = createProvider({
        name: 'c1', 
        dependencies: [ 'b' ],
        eager: true, 
        factory: function (b) {
          return b + '-' + 'C1';
        }
      });

      var c2Provider = createProvider({
        name: 'c2', 
        dependencies: [ 'b' ],
        eager: true, 
        factory: function (b) {
          return b + '-' + 'C2';
        }
      });

      // when
      $rootScope.$digest();

      // then
      expect(bProvider.get()).toBe('A1-A2');

      expect(c1Provider.get()).toBe('A1-A2-C1');
      expect(c2Provider.get()).toBe('A1-A2-C2');

      // when

      a2Provider.set('XX');

      $rootScope.$digest();

      expect(bProvider.get()).toBe('A1-XX');

      expect(c1Provider.get()).toBe('A1-XX-C1');
      expect(c2Provider.get()).toBe('A1-XX-C2');
    }));

    it('should handle nested dependent data changes (<>)', inject(function($rootScope) {

      var createProvider = createProviderFactory();

      var aProvider = createProvider({
        name: 'a', 
        value: 'A'
      });

      var b1Provider = createProvider({
        name: 'b1',
        dependencies: [ 'a' ], 
        factory: function (a) {
          return a + '-B1';
        }
      });

      var b2Provider = createProvider({
        name: 'b2', 
        dependencies: [ 'a' ],
        factory: function (a) {
          return a + '-B2';
        }
      });

      var cProvider = createProvider({
        name: 'c', 
        dependencies: [ 'b1', 'b2' ],
        eager: true, 
        factory: function (b1, b2) {
          return b1 + '-' + b2;
        }
      });

      // when
      $rootScope.$digest();

      // then
      expect(b1Provider.get()).toBe('A-B1');
      expect(b2Provider.get()).toBe('A-B2');

      expect(cProvider.get()).toBe('A-B1-A-B2');

      // when

      aProvider.set('XX');

      $rootScope.$digest();

      expect(b1Provider.get()).toBe('XX-B1');
      expect(b2Provider.get()).toBe('XX-B2');

      expect(cProvider.get()).toBe('XX-B1-XX-B2');
    }));

  });
});