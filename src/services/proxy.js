/**
 * Created by tzachit on 09/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').factory('Proxy', [
    function(){

      function Proxy(target, handler) {
        if(target === null || (typeof target !== 'object' && typeof target !== 'function')){
          throw new TypeError("Target must be object or function.");
        }

        if(handler === undefined){
          return
        }

        if(handler === null || typeof handler !== 'object'){
          throw  new TypeError("Handler mut be object");
        }

        if(typeof target === 'function'){

          if(typeof handler.apply !== 'function'){
            return;
          }

          return function(...args){ return handler.apply(target, this, args) };

        }else{

          if(typeof handler.get !== 'function' && typeof handler.set !== 'function'){
            return;
          }

          for(let prop in target){

            let proxy = {};

            if(handler.get !== undefined){
              proxy.get = () => handler.get(target, prop);
            }

            if(handler.set !== undefined){
              proxy.set = val => { handler.set(target, prop, val); }
            }

            Object.defineProperty(this, prop, proxy);
          }
        }
      }

      return Proxy;
    }
  ]);

}(window.angular));
