/**
 * Created by tzachit on 01/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').directive('toolBar', [
    function(){
      return {
        require: '^^map',
        controller: function() {
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
    }
  ]);

}(window.angular));
