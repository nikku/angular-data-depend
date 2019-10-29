describe('dataDepend', function() {

  beforeEach(module('dataDepend', function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  var $data;

  var __$rootScope;

  beforeEach(inject(function($rootScope, dataDepend) {
    $data = dataDepend.create($rootScope);
    __$rootScope = $rootScope;
  }));

  function tick() {
    __$rootScope.$digest();
  }

  function spyOnFunction(fn) {
    return jasmine.createSpy().andCallFake(fn);
  }

  describe('basic usage', function() {

    it('should resolve simple data', inject(function() {

      // given
      var foo;

      $data.provide('foo', function() {
        return 'FOO';
      });

      // when
      var status = $data.observe('foo', function(_foo) {
        foo = _foo;
      });

      // then
      expect(status.$loaded).not.toBe(true);

      // but after
      tick();

      // then
      expect(foo).toEqual("FOO");
      expect(status.$loaded).toBe(true);
    }));

    it('should resolve simple data (multiple)', inject(function() {

      // given
      var foo, bar;

      // when
      $data.provide([ 'foo', 'bar' ], function() {
        return [ 'FOO', 'BAR' ];
      });

      var $foo = $data.observe('foo', function(_foo) {
        foo = _foo;
      });

      var $bar = $data.observe('bar', function(_bar) {
        bar = _bar;
      });

      // then
      expect($foo.$loaded).not.toBe(true);
      expect($bar.$loaded).not.toBe(true);

      // but after
      tick();

      // then
      expect(foo).toEqual('FOO');
      expect(bar).toEqual('BAR');

      expect($foo.$loaded).toBe(true);
      expect($bar.$loaded).toBe(true);
    }));

    it('should resolve simple data (arrays)', inject(function() {
      // given
      var foo;
      var bar = ['bar'];

      $data.provide('foo', bar);

      // when
      var status = $data.observe('foo', function(_foo) {
        foo = _foo;
      });

      // then
      expect(status.$loaded).not.toBe(true);

      // but after
      tick();

      // then
      expect(foo).toBe(bar);
      expect(status.$loaded).toBe(true);
    }));

    it('should resolve deferred data', inject(function($q) {

      // given
      var deferred = $q.defer(),
          foo;

      $data.provide('foo', function() {
        return deferred.promise;
      });

      // when
      var status = $data.observe('foo', function(_foo) {
        foo = _foo;
      });

      tick();

      // then
      expect(status.$loaded).not.toBe(true);

      // when resolving promise
      deferred.resolve('FOO');
      tick();

      // then
      expect(status.$loaded).toBe(true);
      expect(foo).toBe('FOO');
    }));

    it('should update on #changed', inject(function($q) {

      // given
      var globalFoo = 'FOO',
          foo;

      $data.provide('foo', function() {
        return globalFoo;
      });

      // when
      var status = $data.observe('foo', function(_foo) {
        foo = _foo;
      });

      tick();

      // then
      expect(status.$loaded).toBe(true);
      expect(foo).toBe(globalFoo);

      // when
      // changing global foo and notifying via #changed
      globalFoo = 'BAR';

      $data.changed('foo');
      tick();

      // then
      expect(status.$loaded).toBe(true);
      expect(foo).toBe(foo);
    }));

    it('should update after #set', inject(function() {

      // given
      var foo;

      $data.provide('bar', 'BAR');

      $data.provide('foo', [ 'bar', function(bar) {
        return bar;
      }]);

      // when
      var status = $data.observe('foo', function(_foo) {
        foo = _foo;
      });

      tick();

      // then
      expect(status.$loaded).toBe(true);
      expect(foo).toBe('BAR');

      // when
      // change bar via #set
      $data.set('bar', 'FOOBAR');
      tick();

      // then
      expect(status.$loaded).toBe(true);
      expect(foo).toBe('FOOBAR');
    }));

    it('should provide access to scope bindings via #watchScope', inject(function($rootScope) {

      // given
      var foo, bar, fooBar;

      $rootScope.foo = 'FOO';

      $data.watchScope('bar');
      $data.watchScope('fooBar', 'foo.bar');
      $data.watchScope('foo');

      var status = $data.observe([ 'foo', 'bar', 'fooBar' ], function(_foo, _bar, _fooBar) {
        foo = _foo;
        bar = _bar;
        fooBar = _fooBar;
      });

      // when
      tick();

      // then
      expect(foo).toEqual($rootScope.foo);
      expect(bar).toEqual($rootScope.bar);
      expect(fooBar).not.toBeDefined();

      // when
      // changing scope binding
      $rootScope.foo = { bar: 'FOOBAR' };
      tick();

      // then
      expect(foo).toBe($rootScope.foo);
      expect(bar).toEqual($rootScope.bar);
      expect(fooBar).toBe($rootScope.foo.bar);

      // when
      // removing scope binding
      delete $rootScope.foo;
      tick();

      // then
      expect(foo).toBe($rootScope.foo);
      expect(bar).toEqual($rootScope.bar);
      expect(fooBar).not.toBeDefined();
    }));

    it('should provide access to old scope bindings via #watchScope and :old suffix', inject(function($rootScope) {

      // given
      var foo, fooOld, bar, barOld;

      $rootScope.foo = 'FOO';

      // when
      $data.watchScope('bar', 'bar');
      $data.watchScope('foo');

      var status = $data.observe([ 'foo', 'foo:old', 'bar', 'bar:old'], function(_foo, _fooOld, _bar, _barOld) {
        foo = _foo;
        fooOld = _fooOld;
        bar = _bar;
        barOld = _barOld;
      });

      tick();

      // then
      expect(foo).toEqual($rootScope.foo);
      expect(fooOld).toEqual(null);
      expect(bar).toEqual($rootScope.bar);
      expect(barOld).toEqual(null);

      // when changes in scope

      $rootScope.foo = 'FOOBAR';
      $rootScope.bar = 'BAR';

      tick();

      expect(foo).toEqual($rootScope.foo);
      expect(fooOld).toEqual('FOO');
      expect(bar).toEqual($rootScope.bar);
      expect(barOld).toEqual(null);
      
      // when removing scope binding

      delete $rootScope.foo;

      tick();

      expect(foo).toBe($rootScope.foo);
      expect(fooOld).toEqual('FOOBAR');
    }));

    it('should resolve data via promise', inject(function($q) {

      // given
      var deferred, value;

      var $producer = $data.provide('a', function() {
        deferred = $q.defer();

        return deferred.promise;
      });

      var $value = $data.observe('a', function(a) {
        value = a;
      });

      // when
      tick();

      // then
      expect(!!$producer.$loaded).toBe(false);
      expect(!!$value.$loaded).toBe(false);

      // but when ...
      deferred.resolve('A');
      tick();

      // then
      expect(value).toBe('A');
    }));

    it('should produce multiple values', inject(function() {

      // given
      var a, b, c, d, e;

      var abFactory = spyOnFunction(function() {
        return [ 'A', 'B' ];
      });

      var $ab = $data.provide([ 'a', 'b' ], abFactory);

      var $c = $data.provide('c', [ 'a', function(a) {
        return a + '-C';
      }]);

      var $d = $data.provide('d', [ 'b', function(b) {
        return b + '-D';
      }]);

      var $e = $data.provide('e', [ 'a', 'b', function(a, b) {
        return a + '-' + b + '-E';
      }]);

      // when
      var $all = $data.observe([ 'a', 'b', 'c', 'd', 'e'], function(_a, _b, _c, _d, _e) {
        a = _a, b = _b, c = _c, d = _d, e = _e;
      });

      tick();

      // then
      expect(a).toEqual('A');
      expect(b).toEqual('B');
      expect(c).toEqual('A-C');
      expect(d).toEqual('B-D');
      expect(e).toEqual('A-B-E');

      expect(abFactory.calls.length).toBe(1);
    }));

    it('should handle nested dependent data changes (X)', inject(function() {

      // given
      var a1, a2, b, c1, c2;

      var $a1 = $data.provide('a1', 'A1');
      var $a2 = $data.provide('a2', 'A2');

      var bFactory = spyOnFunction(function (a1, a2) {
        return a1 + '-' + a2;
      });

      var $b = $data.provide('b', [ 'a1', 'a2', bFactory ]);

      var c1Factory = spyOnFunction(function (b) {
        return b + '-' + 'C1';
      });

      var $c1 = $data.provide('c1', [ 'b', c1Factory ]);

      var c2Factory = spyOnFunction(function (b) {
        return b + '-' + 'C2';
      });

      var $c2 = $data.provide('c2', [ 'b', c2Factory ]);

      var $all = $data.observe([ 'a1', 'a2', 'b', 'c1', 'c2' ], function(_a1, _a2, _b, _c1, _c2) {
        a1 = _a1, a2 = _a2, b = _b, c1 = _c1, c2 = _c2;
      });

      // when
      tick();

      // then
      expect(b).toBe('A1-A2');
      expect(c1).toBe('A1-A2-C1');
      expect(c2).toBe('A1-A2-C2');

      // validate calls
      expect(bFactory.calls.length).toBe(1);
      expect(c1Factory.calls.length).toBe(1);
      expect(c2Factory.calls.length).toBe(1);

      // when a2 changes ...
      $data.set('a2', 'XX');
      tick();

      // then
      expect(b).toBe('A1-XX');
      expect(c1).toBe('A1-XX-C1');
      expect(c2).toBe('A1-XX-C2');

      // validate calls
      expect(bFactory.calls.length).toBe(2);
      expect(c1Factory.calls.length).toBe(2);
      expect(c2Factory.calls.length).toBe(2);
    }));

    it('should handle nested dependent data changes (<>)', inject(function() {

      // given
      var a, b1, b2, c;

      var $a = $data.provide('a', 'A');

      var b1Factory = spyOnFunction(function (a) {
        return a + '-B1';
      });

      var $b1 = $data.provide('b1', [ 'a', b1Factory ]);

      var b2Factory = spyOnFunction(function (a) {
        return a + '-B2';
      });

      var $b2 = $data.provide('b2', [ 'a', b2Factory ]);

      var cFactory = spyOnFunction(function (b1, b2) {
        return b1 + '-' + b2;
      });

      var $c = $data.provide('c', [ 'b1', 'b2', cFactory ]);

      var $all = $data.observe([ 'a', 'b1', 'b2', 'c' ], function(_a, _b1, _b2, _c) {
        a = _a, b1 = _b1, b2 = _b2, c = _c;
      });

      // when
      tick();

      // then
      expect(b1).toBe('A-B1');
      expect(b2).toBe('A-B2');
      expect(c).toBe('A-B1-A-B2');

      // validate calls
      expect(b1Factory.calls.length).toBe(1);
      expect(b2Factory.calls.length).toBe(1);
      expect(cFactory.calls.length).toBe(1);

      // when a changes ...
      $data.set('a', 'XX');
      tick();

      // then
      expect(b1).toBe('XX-B1');
      expect(b2).toBe('XX-B2');
      expect(c).toBe('XX-B1-XX-B2');

      // validate calls
      expect(b1Factory.calls.length).toBe(2);
      expect(b2Factory.calls.length).toBe(2);
      expect(cFactory.calls.length).toBe(2);
    }));

    describe('consistency', function() {

      it('should resolve factory with most up-to-date value on out of order update', inject(function($q) {

        // given
        var deferredB = $q.defer(),
            a, b, c;

        // when
        $data.provide('a', 'A');

        $data.provide('b', [ 'a', function(a) {
          return deferredB.promise.then(function(b) {
            return a + '-' + b;
          });
        }]);

        $data.provide('c', [ 'a', 'b', function(a, b) {
          return a + '-' + b + '-C';
        }]);

        var status = $data.observe([ 'a', 'b', 'c' ], function(_a, _b, _c) {
          a = _a;
          b = _b;
          c = _c;
        });

        // when
        tick();

        // then
        expect(status.$loaded).not.toBe(true);

        // but when
        // update 'a' -> new now,
        // does not affect b, as it resolves with old a
        $data.set('a', 'X');

        // resolve deferredB
        deferredB.resolve('B');

        tick();

        // then
        expect(status.$loaded).toBe(true);
        expect(a).toEqual('X');
        expect(b).toEqual('A-B');
        expect(c).toEqual('X-A-B-C');
      }));
    });
  });

  describe('scoping', function() {

    it('should provide data in child', inject(function($rootScope, dataDepend) {

      // given
      var childScope = $rootScope.$new(false);
      
      var a;

      // when
      $data.provide('a', 'A');

      var $childData = $data.newChild(childScope);

      var $a = $childData.observe('a', function(_a) {
        a = _a;
      });

      tick();

      // then
      expect(a).toBe('A');

      // when a changes ...
      
      $data.set('a', 'B');
      tick();

      // then
      expect(a).toBe('B');
    }));

    it('should provide data in nested child', inject(function($rootScope, dataDepend) {

      // given
      var childScope = $rootScope.$new(false);
      var nestedChildScope = childScope.$new(false);

      var $childData = $data.newChild(childScope);
      var $nestedChildData = $childData.newChild(nestedChildScope);

      var abc;

      $data.provide('a', 'A');

      // when

      $childData.provide('b', 'B');

      $childData.provide('c', [ 'a', function(a) {
        return a + '-C';
      }]);

      $nestedChildData.observe(['a', 'b', 'c'], function(_a, _b, _c) {
        abc = _a + _b + _c;
      });

      tick();

      // then
      expect(abc).toBe('ABA-C');
    }));

    it('should provide child data locally', inject(function($rootScope, dataDepend) {

      // given
      var childScope = $rootScope.$new(false);
      
      var a;

      // when
      var $childData = $data.newChild(childScope);

      $childData.provide('a', 'A');

      $childData.observe('a', function(_a) {
        a = _a;
      });

      tick();

      // then
      expect(a).toBe('A');

      expect(function() {
        $data.observe('a', function(a) { });
      }).toThrow();
    }));

    it('should propagate #set to correct parent scope', inject(function($rootScope, dataDepend) {

      // given
      var childScope = $rootScope.$new(false);
      var aChild, aRoot;

      $data.provide('a', 'A');

      // when
      var $childData = $data.newChild(childScope);

      $childData.observe('a', function(_a) {
        aChild = _a;
      });

      $data.observe('a', function(_a) {
        aRoot = _a;
      });

      tick();

      // then
      expect(aChild).toBe('A');
      expect(aRoot).toBe('A');

      // when
      // changing a from child ...
      $childData.set('a', 'B');
      tick();

      // then
      expect(aChild).toBe('B');
      expect(aRoot).toBe('B');
    }));

    it('should cleanup child data on scope $destroy', inject(function($rootScope, dataDepend) {

      // given
      var childScope = $rootScope.$new(false);

      var abc;

      $data.provide('a', 'A');

      var $childData = $data.newChild(childScope);

      $childData.provide('b', 'B');

      $childData.provide('c', [ 'a', function(a) {
        return a + '-C';
      }]);

      var callback = spyOnFunction(function(_a, _b, _c) {
        abc = _a + _b + _c;
      });

      $childData.observe(['a', 'b', 'c'], callback);

      tick();

      // just validating
      expect(abc).toBe('ABA-C');
      expect(callback.calls.length).toBe(1);

      // when
      childScope.$destroy();

      // simulate further changes (e.g. async callbacks)
      $data.set('a', 'XX');
      $childData.set('b', 'XX');

      tick();

      // then
      // expect no further calls of factories
      expect(abc).toBe('ABA-C');
      expect(callback.calls.length).toBe(1);
    }));

    it('should cleanup nested child data on scope $destroy', inject(function($rootScope, dataDepend) {

      // given
      var childScope = $rootScope.$new(false);
      var nestedChildScope = childScope.$new(false);

      var abc;

      $data.provide('a', 'A');

      var $childData = $data.newChild(childScope);
      var $nestedChildData = $childData.newChild(nestedChildScope);

      $childData.provide('b', 'B');

      $childData.provide('c', [ 'a', function(a) {
        return a + '-C';
      }]);

      var callback = spyOnFunction(function(_a, _b, _c) {
        abc = _a + _b + _c;
      });

      $nestedChildData.observe(['a', 'b', 'c'], callback);

      tick();

      // just validating
      expect(abc).toBe('ABA-C');
      expect(callback.calls.length).toBe(1);

      // when
      childScope.$destroy();

      // simulate further changes (e.g. async callbacks)
      $data.set('a', 'XX');
      $childData.set('b', 'XX');

      tick();

      // then
      // expect no further calls of factories
      expect(abc).toBe('ABA-C');
      expect(callback.calls.length).toBe(1);
    }));
  });

  describe('optimizations', function() {

    it('should not produce unused data', inject(function() {

      // given
      var value;

      var $a = $data.provide('a', 'A');

      var valueCallback = spyOnFunction(function(a) {
        value = a;
      });
      
      $data.observe('a', valueCallback);

      var unusedFactory = spyOnFunction(function (a) {
        return a;
      });

      $data.provide('unused', [ 'a' , unusedFactory ]);

      // when
      tick();

      // then
      expect(value).toBe('A');

      expect(valueCallback.calls.length).toBe(1);
      expect(unusedFactory.calls.length).toBe(0);

      // when a changes ...
      $data.set('a', 'XX');
      tick();

      // then
      expect(value).toBe('XX');
      expect(valueCallback.calls.length).toBe(2);
      expect(unusedFactory.calls.length).toBe(0);
    }));
  });

  describe('error propagation', function() {

    it('should update status on load error', function() {

      var a;

      // given
      $data.provide('a', function() {
        throw new Error("not available");
      });

      // when
      var status = $data.observe(['a', function(_a) {
        a = _a;
      }]);

      tick();

      // then
      expect(a).not.toBeDefined();

      expect(!!status.$loaded).toBe(false);
      expect(status.$error).toBeDefined();

      expect(status.$error.toString()).toEqual("Error: <a> <- unresolvable: not available");
    });

    it('should update dependent status on load error', function() {

      var d;

      // given
      $data.provide('a', function() {
        throw new Error("not available");
      });

      $data.provide('b', ['a', function(_a) {
        return _a + '-B';
      }]);

      $data.provide('c', function() {
        return 'C';
      });

      $data.provide('d', [ 'b', 'c', function(_b, _c) {
        return _b + _c;
      }]);

      // when
      var status = $data.observe(['d', function(_d) {
        d = _d;
      }]);

      tick();

      // then
      expect(d).not.toBeDefined();
      expect(status.$error).toBeDefined();

      expect(status.$error.toString()).toEqual("Error: <d> <- <b> <- <a> <- unresolvable: not available");
    });

    it('should reload successfully after load error', function() {

      var unavailable = true;
      var a;

      // given
      $data.provide('a', function() {
        if (unavailable) {
          throw new Error("not available");
        } else {
          return 'A';
        }
      });

      // when
      var status = $data.observe(['a', function(_a) {
        a = _a;
      }]);

      tick();

      // then
      expect(a).not.toBeDefined();

      expect(!!status.$loaded).toBe(false);
      expect(status.$error).toBeDefined();

      expect(status.$error.toString()).toEqual("Error: <a> <- unresolvable: not available");

      // but when
      
      unavailable = false;
      status.reload();

      tick();

      expect(status.$loaded).toBe(true);
      expect(status.$error).not.toBeDefined();
    });

    it('should reload nested successfully after load error', function() {

      var unavailable = true;
      var d;

      // given
      $data.provide('a', function() {
        if (unavailable) {
          throw new Error("not available");
        } else {
          return 'A';
        }
      });

      $data.provide('b', ['a', function(_a) {
        return _a + '-B';
      }]);

      $data.provide('c', function() {
        return 'C';
      });

      $data.provide('d', [ 'b', 'c', function(_b, _c) {
        return _b + _c;
      }]);

      // when
      var status = $data.observe(['d', function(_d) {
        d = _d;
      }]);

      tick();

      // then
      expect(d).not.toBeDefined();
      expect(status.$error).toBeDefined();

      // but when
      unavailable = false;
      status.reload();

      tick();

      expect(status.$loaded).toBe(true);
      expect(status.$error).not.toBeDefined();
    });
  });

  describe('assertions', function() {

    it('should raise error when setting value on factory-based provider', inject(function() {

      // given
      $data.provide('factory', function() {
        return -1;
      });

      // when -> then
      expect(function() {
        $data.set('factory', 'some-fixed-value');
      }).toThrow();
    }));

    it('should raise error when setting factory on value-based provider', inject(function() {

      // given
      $data.provide('value', 'some-fixed-value');

      // when -> then
      expect(function() {
        $data.set('value', function() {
          return 'produced';
        });
      }).toThrow();
    }));
  });
});