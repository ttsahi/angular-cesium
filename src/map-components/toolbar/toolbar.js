/**
 * Created by erezy on 01/02/15.
 */
'use strict';

angular.module('angularCesium').directive('toolbar', function() {

  return {
    restrict : 'E',
    template : '<div class="toolbar" ><div class="drag-button glyphicon glyphicon-minus" draggable></div> <ng-transclude></ng-transclude></div>',
    transclude : true,
    require : '^map',
    controller : function($scope) {
      let currentTool = null;

      this.getCesiumWidget = () => $scope.getCesiumWidget();

      this.startTool = function(tool){
        if(currentTool !== null){
          currentTool.stop();
        }

        currentTool = tool;
        currentTool.start();
      };
    },
    link : {
      pre: function(scope, element, attrs, mapCtrl){
        scope.getCesiumWidget = mapCtrl.getCesiumWidget;
        scope.mapRect = angular.element(scope.getCesiumWidget().container)[0].getBoundingClientRect();
      }
    }
  };
});
