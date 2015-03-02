/**
 * Created by erezy on 08/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').factory('CenterTool', ['Tool',
    function(Tool){

      class CenterTool extends Tool {
        constructor(map){
          this._scene = map.scene;
          this._canvas = map.canvas;
          this._camera = this._scene.camera;
          this._ellipsoid = this._scene.globe.ellipsoid;
          this._handler = new Cesium.ScreenSpaceEventHandler(this._canvas);
        }

        _startHandler(){
          this._handler.setInputAction(movement => {
            let cartesian = this._camera.pickEllipsoid(movement.position);
            if(cartesian){
              let cameraHeight = this._ellipsoid.cartesianToCartographic(this._camera.position).height;
              let cartographic = this._ellipsoid.cartesianToCartographic(cartesian);
              let point = {
                lon: Cesium.Math.toDegrees(cartographic.longitude),
                lat: Cesium.Math.toDegrees(cartographic.latitude)
              };
              this._camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, cameraHeight)
              });
            }
          }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        }

        _stopHandler(){
          this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        }

        start(){
          this._scene.screenSpaceCameraController.enableRotate = false;
          angular.element(this._canvas).css('cursor','copy');
          this._startHandler();
        }

        stop(){
          this._scene.screenSpaceCameraController.enableRotate = true;
          angular.element(this._canvas).css('cursor','initial');
          this._stopHandler();
        }

        cancel(){ console.log('Examp-Tool start!'); }

        onUpdate(){ console.log('Examp-Tool start!'); }


      }

      return CenterTool;
    }
  ]);

}(window.angular));
