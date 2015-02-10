/**
 * Created by erezy on 01/02/15.
 */
'use strict';

angular.module('angularCesium').directive('toolbar', function() {

  return {
    restrict : 'E',
    template : '<div class="toolbar" ><div class="drag-button glyphicon glyphicon-minus" draggable></div> <ng-transclude></ng-transclude></div>',
    transclude : true,
    require : '^^map',
    controller : function() {
      let currentTool = null;

      this.startTool = function(tool){
        if(currentTool !== null){
          currentTool.stop();
        }

        currentTool = tool;
        currentTool.start();
      };
    }
  };
});
