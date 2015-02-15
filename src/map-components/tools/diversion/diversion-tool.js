/**
 * Created by erezy on 08/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').factory('DiversionTool', ['Tool',
    function(Tool){

      class DiversionTool extends Tool {
        constructor(map){
          this._scene = map.scene;
          this._canvas = map.canvas;
        }

        start(){ this._scene.screenSpaceCameraController.enableRotate = true;angular.element(this._canvas).css('cursor','-webkit-grab'); console.log(this._canvas,angular.element(this._canvas))}

        stop(){ this._scene.screenSpaceCameraController.enableRotate = false; angular.element(this._canvas).css('cursor','initial');console.log('diversion end')}

        cancel(){ console.log('Examp-Tool start!'); }

        onUpdate(){ console.log('Examp-Tool start!'); }


      }

      return DiversionTool;
    }
  ]);

}(window.angular));
