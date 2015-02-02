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
      this.currentTool = null;
      this.switchTool = function(tool) {
        if(this.currentTool != null){
          this.currentTool.stop();
        }
        this.currentTool = tool;
        this.currentTool.start();
      }
    },
    link : {
      post: function (scope, element) {

      }
    }
  };
});
