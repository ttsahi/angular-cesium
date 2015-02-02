/**
 * Created by tzachit on 01/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').directive('tool', ['Tool',
    function(Tool){
      return {
        replace: true,
        require: '^toolBar',
        template: '<div ng-include="template"></div>',
        scope: {
          type: '=',
          template: '@'
        },
        link: function(scope, element, attrs, toolBarCtrl){
          if(!(typeof scope.type === 'function')){
            throw new TypeError("type attr must be constructor.");
          }

          let tool = new scope.type(toolBarCtrl.getCesiumWidget());

          if(!(tool instanceof Tool)){
            throw new TypeError("tool must be instance of Tool.");
          }

          let proxy = {};

          for(let key in tool){
            if(key === 'start'){
              continue;
            }
            Object.defineProperty(proxy, key, {
              get: () => tool[key],
              set: val => { tool[key] = val; }
            });
          }

          Object.defineProperty(proxy, 'start', {
            get: () => () => toolBarCtrl.startTool(tool)
          });

          scope.tool = proxy;
        }
      };
    }
  ]);

}(window.angular));
