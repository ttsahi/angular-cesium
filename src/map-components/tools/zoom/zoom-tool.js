/**
 * Created by tzachit on 02/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').factory('ZoomTool', ['Tool',
    function(Tool){

      let _camera = Symbol('_camera');
      let _ellipsoid = Symbol('_ellipsoid');

      class ZoomTool extends Tool {
        constructor(map){
          this[_camera] = map.scene.camera;
          this[_ellipsoid] = map.scene.globe.ellipsoid;
        }

        start(){ return true; }

        stop(){ return true; }

        zoomIn(jumps){
          jumps = Number.isFinite(jumps) ? jumps : 1;
          for(let i = 0; i < jumps; i++){
            let cameraHeight = this[_ellipsoid].cartesianToCartographic(this[_camera].position).height;
            let moveRate = cameraHeight / 100.0;
            this[_camera].moveForward(moveRate);
          }
        }

        zoomOut(jumps){
          jumps = Number.isFinite(jumps) ? jumps : 1;
          for(let i = 0; i < jumps; i++){
            let cameraHeight = this[_ellipsoid].cartesianToCartographic(this[_camera].position).height;
            let moveRate = cameraHeight / 100.0;
            this[_camera].moveBackward(moveRate);
          }
        }
      }

      return ZoomTool;
    }
  ]);

}(window.angular));
