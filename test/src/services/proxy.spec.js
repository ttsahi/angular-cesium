/**
 * Created by tzachit on 09/02/15.
 */

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('services', function(){
    describe('proxy', function(){

      var Proxy;

      beforeEach(inject(function(_Proxy_){
        Proxy = _Proxy_;
      }));

      describe('constructor', function(){
        it('should throw type error when called with non object or function target.', function(){
          expect(function(){ Proxy(null); }).toThrow();
          expect(function(){ Proxy(undefined); }).toThrow();
          expect(function(){ Proxy(true); }).toThrow();
          expect(function(){ Proxy(5); }).toThrow();
          expect(function(){ Proxy('aaa'); }).toThrow();
        });

        it('should return undefined or empty proxy when called with none handler.', function(){
          expect(Proxy({}, undefined)).toBe(undefined);
        });

        it('should throw TypeError when called with null or non object handler.', function(){
          expect(function(){ Proxy({}, null); }).toThrow();
          expect(function(){ Proxy({}, true); }).toThrow();
          expect(function(){ Proxy({}, 5); }).toThrow();
          expect(function(){ Proxy({}, 'aaa'); }).toThrow();
        });

        it('should return function when initialize with function target.', function(){
          expect(typeof Proxy(function(){}, {apply: function(){}}) === 'function').toBeTruthy();
        });

        it('should return object when initialize with object target.', function(){
          expect(typeof new Proxy({}, {get: function(){}}) === 'object').toBeTruthy();
        });
      });
    });
  });
});
