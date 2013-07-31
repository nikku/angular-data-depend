describe('dataDepend', function() {

  beforeEach(module('dataDepend'));

  describe('API', function() {

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
      expect(status.$loaded).toBe(false);

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
          setdFoo = 'FOO',
          loadedFoo;

      // when
      $data.set('foo', function() {
        return setdFoo;
      });

      var status = $data.get('foo', function(foo) {
        loadedFoo = foo;
      });

      $rootScope.$digest();

      // first cycle
      expect(status.$loaded).toBe(true);
      expect(loadedFoo).toBe('FOO');

      // notify changed foo via #changed
      setdFoo = 'BAR';
      $data.changed('foo');

      $rootScope.$digest();

      // second cycle
      expect(status.$loaded).toBe(true);
      expect(loadedFoo).toBe('BAR');
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
  })
});