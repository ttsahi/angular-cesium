/**
 * Created by tzachit on 05/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').factory('ZoomAreaTool', ['Tool', 'Cesium',
    function(Tool, Cesium){

      let _map = Symbol('_map');
      let _ensureFly = Symbol('_ensureFly');
      let _mapContainer = Symbol('_mapContainer');
      let _mapEventsHandler = Symbol('_mapEventsHandler');
      let _mapContainerMouseDownHandler = Symbol('_mapContainerMouseDownHandler');
      let _mapContainerMouseMoveHandler = Symbol('_mapContainerMouseMoveHandler');
      let _mapContainerMouseUpHandler = Symbol('_mapContainerMouseUpHandler');
      let _mapContainerMouseLeave = Symbol('_mapContainerMouseLeave');
      let _cesiumWidgetMouseDownHandler = Symbol('_cesiumWidgetMouseDownHandler');
      let _cesiumWidgetMouseUpHandler = Symbol('_cesiumWidgetMouseUpHandler');
      let _initMapContainerMouseHandlers = Symbol('_initMapContainerMouseHandlers');
      let _bindMapContainerMouseHandlers = Symbol('_bindMapContainerMouseHandlers');
      let _unbindMapContainerMouseHandlers = Symbol('_unbindMapContainerMouseHandlers');
      let _initCesiumWidgetMouseHandlers = Symbol('_initCesiumWidgetMouseHandlers');
      let _bindCesiumWidgetMouseHandlers = Symbol('_bindCesiumWidgetMouseHandlers');
      let _unbindCesiumWidgetMouseHandlers = Symbol('_unbindCesiumWidgetMouseHandlers');

      class ZoomAreaTool extends Tool {
        constructor(map){
          this[_map] = map;
          this[_ensureFly] = false;

          this[_mapContainer] = angular.element(map.canvas.parentNode);
          this[_mapEventsHandler] = new Cesium.ScreenSpaceEventHandler(map.canvas);

          this[_mapContainerMouseDownHandler] = null;
          this[_mapContainerMouseMoveHandler] = null;
          this[_mapContainerMouseUpHandler] = null;
          this[_mapContainerMouseLeave] = null;

          this[_cesiumWidgetMouseDownHandler] = null;
          this[_cesiumWidgetMouseUpHandler] = null;

          this[_initMapContainerMouseHandlers]();
          this[_initCesiumWidgetMouseHandlers]();
        }

        [_initMapContainerMouseHandlers](){
          let pageX = 0;
          let pageY = 0;
          let startX = 0;
          let startY = 0;
          let deltaX = 0;
          let deltaY = 0;
          let selectedStart = false;

          let selector = angular.element('<div></div>');
          selector.css('border', '2px dashed white');

          this[_mapContainerMouseDownHandler] = event => {
            pageX = event.pageX;
            pageY = event.pageY;
            startX = event.offsetX;
            startY = event.offsetY;
            this[_ensureFly] = false;
            this[_mapContainer].css('cursor', 'zoom-in');

            selector.css({
              position: 'absolute',
              top: `${startY}px`,
              left: `${startX}px`,
              width: '0px',
              height: '0px'
            });

            this[_mapContainer].append(selector);
            selectedStart = true;
          };

          this[_mapContainerMouseMoveHandler] = event => {
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
          };

          this[_mapContainerMouseUpHandler] = event => {
            selectedStart = false;
            selector.remove();
            this[_mapContainer].css('cursor', '');
            this[_ensureFly] = true;
          };

          this[_mapContainerMouseLeave] = event => {
            selectedStart = false;
            this[_mapContainer].css('cursor', '');
            selector.remove();
          };
        }

        [_bindMapContainerMouseHandlers](){
          this[_mapContainer].on('mousedown', this[_mapContainerMouseDownHandler]);
          this[_mapContainer].on('mousemove', this[_mapContainerMouseMoveHandler]);
          this[_mapContainer].on('mouseup', this[_mapContainerMouseUpHandler]);
          this[_mapContainer].on('mouseleave', this[_mapContainerMouseLeave]);
        }

        [_unbindMapContainerMouseHandlers](){
          this[_mapContainer].off('mousedown', this[_mapContainerMouseDownHandler]);
          this[_mapContainer].off('mousemove', this[_mapContainerMouseMoveHandler]);
          this[_mapContainer].off('mouseup', this[_mapContainerMouseUpHandler]);
          this[_mapContainer].off('mouseleave', this[_mapContainerMouseLeave]);
        }

        [_initCesiumWidgetMouseHandlers](){
          let startPosition = null;
          let endPosition = null;
          let camera = this[_map].scene.camera;
          let ellipsoid = this[_map].scene.globe.ellipsoid;

          this[_cesiumWidgetMouseDownHandler] = movement => {
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
          };

          this[_cesiumWidgetMouseUpHandler] = movement =>  {
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

            if(this[_ensureFly] && startPosition !== null && endPosition != null){
              this[_ensureFly] = false;

              let rectangle = Cesium.Rectangle.fromDegrees(
                startPosition.lon, startPosition.lat, endPosition.lon, endPosition.lat
              );

              camera.flyToRectangle({
                destination: rectangle
              });
            }
          };
        }

        [_bindCesiumWidgetMouseHandlers](){
          this[_mapEventsHandler].setInputAction(this[_cesiumWidgetMouseDownHandler], Cesium.ScreenSpaceEventType.LEFT_DOWN);
          this[_mapEventsHandler].setInputAction(this[_cesiumWidgetMouseUpHandler], Cesium.ScreenSpaceEventType.LEFT_UP);
        }

        [_unbindCesiumWidgetMouseHandlers](){
          this[_mapEventsHandler].removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
          this[_mapEventsHandler].removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
      }

        start(){
          this[_map].scene.screenSpaceCameraController.enableRotate = false;
          this[_ensureFly] = false;
          this[_bindCesiumWidgetMouseHandlers]();
          this[_bindMapContainerMouseHandlers]();
        }

        stop(){
          this[_map].scene.screenSpaceCameraController.enableRotate = true;
          this[_unbindMapContainerMouseHandlers]();
          this[_unbindCesiumWidgetMouseHandlers]();
        }
      }

      return ZoomAreaTool;
    }
  ]);

}(window.angular));
