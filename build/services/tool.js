"use strict";
'use strict';
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('Tool', [function() {
    var Tool = function Tool() {};
    ($traceurRuntime.createClass)(Tool, {
      start: function() {
        throw "No implementation";
      },
      stop: function() {
        throw "No implementation";
      },
      cancel: function() {
        throw "No implementation";
      },
      onUpdate: function() {
        throw "No implementation";
      }
    }, {});
    return Tool;
  }]);
}(window.angular));
//# sourceURL=services/tool.js