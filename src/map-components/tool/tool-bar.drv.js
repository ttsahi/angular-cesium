/**
 * Created by tzachit on 01/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').directive('toolBar', [
    function(){
      return {
        require: '^map',
        transclude: true,
        template: '<div ng-transclude=""></div>',
        controller: ['$scope',
          function($scope) {
            let currentTool = null;

            this.getCesiumWidget = () => $scope.getCesiumWidget();

            this.startTool = function(tool){
              if(currentTool !== null){
                currentTool.stop();
              }

              currentTool = tool;
              currentTool.start();
            };
          }
        ],
        link: {
          pre: function(scope, element, attrs, mapCtrl){
            scope.getCesiumWidget = mapCtrl.getCesiumWidget;
          }
        }
      };
    }
  ]);

}(window.angular));
