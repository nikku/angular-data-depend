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

    it('should resolve data using promise', inject(function($rootScope, dataFactory) {

      var dataDepend = { providers: {} };

      var data = dataFactory.create({ 
        name: 'foo', 
        registry: dataDepend,
        factory: function() {
          return 'FOO';
        }
      });

      var value;

      // when
      var getter = data.get();

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

      var dataDepend = { providers: {} };

      var dataFoo = dataFactory.create({ 
        name: 'foo', 
        registry: dataDepend,
        factory: function() {
          return 'FOO';
        }
      });

      dataDepend.providers['foo'] = dataFoo;

      var dataBar = dataFactory.create({ 
        name: 'bar', 
        registry: dataDepend,
        dependencies: ['foo'],
        factory: function(foo) {
          return foo;
        }
      });

      var barValue;

      // when
      var barGetter = dataBar.get();

      barGetter.then(function(v) {
        barValue = v;
      });

      // trigger value change
      $rootScope.$digest();

      expect(barValue).toBe('FOO');
    }));

    it('should resolve dependent data', inject(function($rootScope, dataFactory) {

      var dataDepend = { providers: {} };

      var producedLevel0A = 'A';
      var producedLevel0B = 'B';

      var dataLevel0A = createData('level0A', [], false, function () {
        return producedLevel0A;        
      });

      var dataLevel0B = createData('level0B', [], false, function () {
        return producedLevel0B;
      });

      var dataLevel1 = createData('level1', [ 'level0A', 'level0B' ], false, function (level0A, level0B) {
        return level0A + '-' + level0B;
      });

      var dataLevel2A = createData('level2A', [ 'level1' ], true, function (level1) {
        return level1 + '-' + 'A2';
      });

      var dataLevel2B = createData('level2B', [ 'level1' ], true, function (level1) {
        return level1 + '-' + 'B2';
      });      

      function createData(name, dependencies, resolve, factory) {
        var data = dataFactory.create({ 
          name: name,
          registry: dataDepend,
          resolve: resolve,
          dependencies: dependencies,
          factory: factory
        });

        dataDepend.providers[ name ] = data;

        return data;
      }

      // when

      // trigger value change
      $rootScope.$digest();

      expect(dataLevel1.value).toBe('A-B');

      expect(dataLevel2A.value).toBe('A-B-A2');
      expect(dataLevel2B.value).toBe('A-B-B2');

      /*// change result produced by foo provider
      producedLevel0A = 'C';
      dataFoo.get({ reload: true });

      // trigger value change
      $rootScope.$digest();

      expect(dataBar.value).toBe(producedFoo);*/
    }));

  });
});