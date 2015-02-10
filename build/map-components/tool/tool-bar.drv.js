"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').directive('toolBar', [function() {
    return {
      require: '^^map',
      controller: function() {
        var currentTool = null;
        this.startTool = function(tool) {
          if (currentTool !== null) {
            currentTool.stop();
          }
          currentTool = tool;
          currentTool.start();
        };
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tool/tool-bar.drv.js