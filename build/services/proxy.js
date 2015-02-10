"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('Proxy', [function() {
    function Proxy(target, handler) {
      if (target === null || (typeof target !== 'object' && typeof target !== 'function')) {
        throw new TypeError("Target must be object or function.");
      }
      if (handler === undefined) {
        return;
      }
      if (handler === null || typeof handler !== 'object') {
        throw new TypeError("Handler mut be object");
      }
      if (typeof target === 'function') {
        if (typeof handler.apply !== 'function') {
          return;
        }
        return function() {
          for (var args = [],
              $__0 = 0; $__0 < arguments.length; $__0++)
            args[$__0] = arguments[$__0];
          return handler.apply(target, this, args);
        };
      } else {
        if (typeof handler.get !== 'function' && typeof handler.set !== 'function') {
          return;
        }
        var $__1 = this,
            $__2 = function(prop) {
              var proxy = {};
              if (handler.get !== undefined) {
                proxy.get = (function() {
                  return handler.get(target, prop);
                });
              }
              if (handler.set !== undefined) {
                proxy.set = (function(val) {
                  handler.set(target, prop, val);
                });
              }
              Object.defineProperty($__1, prop, proxy);
            };
        for (var prop in target) {
          $__2(prop);
        }
      }
    }
    return Proxy;
  }]);
}(window.angular));
//# sourceURL=services/proxy.js