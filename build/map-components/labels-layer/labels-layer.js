"use strict";
angular.module('angularCesium').directive('labelsLayer', function() {
  return {
    restrict: 'E',
    require: '^map',
    scope: {},
    controller: function($scope) {
      this.getLabelCollection = function() {
        return $scope.collection;
      };
    },
    link: {pre: function(scope, element, attrs, mapCtrl) {
        scope.collection = new Cesium.LabelCollection();
        mapCtrl.getCesiumWidget().scene.primitives.add(scope.collection);
        scope.$on('$destroy', function() {
          mapCtrl.getCesiumWidget().scene.primitives.remove(scope.collection);
        });
      }}
  };
});
//# sourceURL=map-components/labels-layer/labels-layer.js