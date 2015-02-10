"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').directive('tool', ['Tool', 'Proxy', function(Tool, Proxy) {
    return {
      require: ['^^map', '^^toolbar'],
      transclude: true,
      template: '<div ng-class="class"></div>',
      scope: {
        type: '=',
        class: '@'
      },
      controller: ['$scope', function($scope) {
        this.getTool = (function() {
          return $scope.tool;
        });
      }],
      link: function(scope, element, attrs, ctrls, linker) {
        if (typeof scope.type !== 'function') {
          throw new TypeError("type attr must be constructor.");
        }
        var tool = new scope.type(ctrls[0].getCesiumWidget());
        if (!(tool instanceof Tool)) {
          throw new TypeError("tool must be instance of Tool.");
        }
        tool.start = Proxy(tool.start, {apply: (function(target, context) {
            return ctrls[1].startTool({
              start: (function() {
                return target.apply(tool);
              }),
              stop: (function() {
                return tool.stop();
              })
            });
          })});
        scope.tool = tool;
        linker(scope, (function(clone) {
          return element.children().append(clone);
        }));
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tool/tool.drv.js