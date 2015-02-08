/**
 * Created by tzachit on 05/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').factory('ZoomAreaTool', ['Tool', 'Cesium',
    function(Tool, Cesium){

      class ZoomAreaTool extends Tool {

        _initMapMouseHandlers(){
          let pageX = 0;
          let pageY = 0;
          let startX = 0;
          let startY = 0;
          let deltaX = 0;
          let deltaY = 0;
          let selectedStart = false;
          let selector = angular.element('<div></div>');
          let mapContainer = angular.element(this._map.canvas.parentNode);

          selector.css('border', '2px dashed white');

          mapContainer.on('mousedown', event => {
            pageX = event.pageX;
            pageY = event.pageY;
            startX = event.offsetX;
            startY = event.offsetY;
            this._enshureFly = false;

            selector.css({
              position: 'absolute',
              top: `${startY}px`,
              left: `${startX}px`,
              width: '0px',
              height: '0px'
            });

            mapContainer.append(selector);
            selectedStart = true;
          });

          mapContainer.on('mousemove', event => {
            if(!selectedStart){
              return;
            }

            deltaX =  event.pageX - pageX;
            deltaY = event.pageY - pageY;

            let selectorStyle = {};

            if(deltaX > 0){
              selectorStyle.width = `${deltaX}px`;
            }
            if(deltaX < 0){
              deltaX = Math.abs(deltaX);
              selectorStyle.width = `${deltaX}px`;
              selectorStyle.left = `${startX - deltaX}px`;
            }
            if(deltaY > 0){
              selectorStyle.height = `${deltaY}px`;
            }
            if(deltaY < 0){
              deltaY = Math.abs(deltaY);
              selectorStyle.height = `${deltaY}px`;
              selectorStyle.top = `${startY - deltaY}px`;
            }

            selector.css(selectorStyle);
          });

          mapContainer.on('mouseup', event => {
            selectedStart = false;
            selector.remove();
            this._enshureFly = true;
          });

          mapContainer.on('mouseleave', event => {
            selectedStart = false;
            selector.remove();
          });
        }

        _removeMapMouseHandlers(){
          let mapContainer = angular.element(this._map.canvas.parentNode);
          mapContainer.unbind('mousedown');
          mapContainer.unbind('mousemove');
          mapContainer.unbind('mouseup');
          mapContainer.unbind('mouseleave');
        }

        _initCesiumMouseHandlers(){
          let startPosition = null;
          let endPosition = null;
          let camera = this._map.scene.camera;
          let ellipsoid = this._map.scene.globe.ellipsoid;
          let handler = new Cesium.ScreenSpaceEventHandler(this._map.canvas);

          handler.setInputAction(movement => {
            let cartesian = camera.pickEllipsoid(movement.position);

            if(cartesian){
              let cartographic = ellipsoid.cartesianToCartographic(cartesian);
              startPosition = {
                lon: Cesium.Math.toDegrees(cartographic.longitude),
                lat: Cesium.Math.toDegrees(cartographic.latitude)
              };
            }else{
              startPosition = null;
            }
          }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

          handler.setInputAction(movement =>  {
            let cartesian = camera.pickEllipsoid(movement.position);

            if(cartesian){
              let cartographic = ellipsoid.cartesianToCartographic(cartesian);
              endPosition = {
                lon: Cesium.Math.toDegrees(cartographic.longitude),
                lat: Cesium.Math.toDegrees(cartographic.latitude)
              };
            }else{
              endPosition = null;
            }

            if(this._enshureFly && startPosition !== null && endPosition != null){
              this._enshureFly = false;

              let rectangle = Cesium.Rectangle.fromDegrees(
                startPosition.lon, startPosition.lat, endPosition.lon, endPosition.lat
              );

              camera.flyToRectangle({
                destination: rectangle
              });
            }
          }, Cesium.ScreenSpaceEventType.LEFT_UP);
        }

        _removeCesiumMouseHandlers(){
          let handler = new Cesium.ScreenSpaceEventHandler(this._map.canvas);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        }

        start(){
          this._map.scene.screenSpaceCameraController.enableRotate = false;
          this._enshureFly = false;
          this._initCesiumMouseHandlers();
          this._initMapMouseHandlers();
        }

        stop(){
          this._map.scene.screenSpaceCameraController.enableRotate = true;
          this._removeCesiumMouseHandlers();
          this._removeMapMouseHandlers();
        }
      }

      return ZoomAreaTool;
    }
  ]);

}(window.angular));
