/**
 * Created by tzachit on 01/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').directive('tool', ['Tool', 'Proxy',
    function(Tool, Proxy){
      return {
        require: ['^^map', '^^toolbar'],
        transclude: true,
        template: '<div ng-class="toolClass"></div>',
        scope: {
          type: '=',
          toolClass: '@'
        },
        controller: ['$scope',
          function($scope){
            this.getTool = () => $scope.tool;
          }
        ],
        link: function(scope, element, attrs, ctrls, linker){
          if(typeof scope.type !== 'function'){
            throw new TypeError("type attr must be constructor.");
          }

          let tool = new scope.type(ctrls[0].getCesiumWidget());

          if(!(tool instanceof Tool)){
            throw new TypeError("tool must be instance of Tool.");
          }

          tool.start = Proxy(tool.start, {
            apply: (target, context) => ctrls[1].startTool({
              start: () => target.apply(tool),
              stop: () => tool.stop()
            })
          });

          scope.tool = tool;

          linker(scope, clone => element.children().append(clone));
        }
      };
    }
  ]);

}(window.angular));
