"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('ZoomAreaTool', ['Tool', 'Cesium', function(Tool, Cesium) {
    var $__2;
    var _map = Symbol('_map');
    var _ensureFly = Symbol('_ensureFly');
    var _mapContainer = Symbol('_mapContainer');
    var _mapEventsHandler = Symbol('_mapEventsHandler');
    var _mapContainerMouseDownHandler = Symbol('_mapContainerMouseDownHandler');
    var _mapContainerMouseMoveHandler = Symbol('_mapContainerMouseMoveHandler');
    var _mapContainerMouseUpHandler = Symbol('_mapContainerMouseUpHandler');
    var _mapContainerMouseLeave = Symbol('_mapContainerMouseLeave');
    var _cesiumWidgetMouseDownHandler = Symbol('_cesiumWidgetMouseDownHandler');
    var _cesiumWidgetMouseUpHandler = Symbol('_cesiumWidgetMouseUpHandler');
    var _initMapContainerMouseHandlers = Symbol('_initMapContainerMouseHandlers');
    var _bindMapContainerMouseHandlers = Symbol('_bindMapContainerMouseHandlers');
    var _unbindMapContainerMouseHandlers = Symbol('_unbindMapContainerMouseHandlers');
    var _initCesiumWidgetMouseHandlers = Symbol('_initCesiumWidgetMouseHandlers');
    var _bindCesiumWidgetMouseHandlers = Symbol('_bindCesiumWidgetMouseHandlers');
    var _unbindCesiumWidgetMouseHandlers = Symbol('_unbindCesiumWidgetMouseHandlers');
    var ZoomAreaTool = function ZoomAreaTool(map) {
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
    };
    ($traceurRuntime.createClass)(ZoomAreaTool, ($__2 = {}, Object.defineProperty($__2, _initMapContainerMouseHandlers, {
      value: function() {
        var $__0 = this;
        var pageX = 0;
        var pageY = 0;
        var startX = 0;
        var startY = 0;
        var deltaX = 0;
        var deltaY = 0;
        var selectedStart = false;
        var selector = angular.element('<div></div>');
        selector.css('border', '2px dashed white');
        this[_mapContainerMouseDownHandler] = (function(event) {
          pageX = event.pageX;
          pageY = event.pageY;
          startX = event.offsetX;
          startY = event.offsetY;
          $__0[_ensureFly] = false;
          $__0[_mapContainer].css('cursor', 'zoom-in');
          selector.css({
            position: 'absolute',
            top: (startY + "px"),
            left: (startX + "px"),
            width: '0px',
            height: '0px'
          });
          $__0[_mapContainer].append(selector);
          selectedStart = true;
        });
        this[_mapContainerMouseMoveHandler] = (function(event) {
          if (!selectedStart) {
            return;
          }
          deltaX = event.pageX - pageX;
          deltaY = event.pageY - pageY;
          var selectorStyle = {};
          if (deltaX > 0) {
            selectorStyle.width = (deltaX + "px");
          }
          if (deltaX < 0) {
            deltaX = Math.abs(deltaX);
            selectorStyle.width = (deltaX + "px");
            selectorStyle.left = ((startX - deltaX) + "px");
          }
          if (deltaY > 0) {
            selectorStyle.height = (deltaY + "px");
          }
          if (deltaY < 0) {
            deltaY = Math.abs(deltaY);
            selectorStyle.height = (deltaY + "px");
            selectorStyle.top = ((startY - deltaY) + "px");
          }
          selector.css(selectorStyle);
        });
        this[_mapContainerMouseUpHandler] = (function(event) {
          selectedStart = false;
          selector.remove();
          $__0[_mapContainer].css('cursor', '');
          $__0[_ensureFly] = true;
        });
        this[_mapContainerMouseLeave] = (function(event) {
          selectedStart = false;
          $__0[_mapContainer].css('cursor', '');
          selector.remove();
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _bindMapContainerMouseHandlers, {
      value: function() {
        this[_mapContainer].on('mousedown', this[_mapContainerMouseDownHandler]);
        this[_mapContainer].on('mousemove', this[_mapContainerMouseMoveHandler]);
        this[_mapContainer].on('mouseup', this[_mapContainerMouseUpHandler]);
        this[_mapContainer].on('mouseleave', this[_mapContainerMouseLeave]);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _unbindMapContainerMouseHandlers, {
      value: function() {
        this[_mapContainer].off('mousedown', this[_mapContainerMouseDownHandler]);
        this[_mapContainer].off('mousemove', this[_mapContainerMouseMoveHandler]);
        this[_mapContainer].off('mouseup', this[_mapContainerMouseUpHandler]);
        this[_mapContainer].off('mouseleave', this[_mapContainerMouseLeave]);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _initCesiumWidgetMouseHandlers, {
      value: function() {
        var $__0 = this;
        var startPosition = null;
        var endPosition = null;
        var camera = this[_map].scene.camera;
        var ellipsoid = this[_map].scene.globe.ellipsoid;
        this[_cesiumWidgetMouseDownHandler] = (function(movement) {
          var cartesian = camera.pickEllipsoid(movement.position);
          if (cartesian) {
            var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            startPosition = {
              lon: Cesium.Math.toDegrees(cartographic.longitude),
              lat: Cesium.Math.toDegrees(cartographic.latitude)
            };
          } else {
            startPosition = null;
          }
        });
        this[_cesiumWidgetMouseUpHandler] = (function(movement) {
          var cartesian = camera.pickEllipsoid(movement.position);
          if (cartesian) {
            var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            endPosition = {
              lon: Cesium.Math.toDegrees(cartographic.longitude),
              lat: Cesium.Math.toDegrees(cartographic.latitude)
            };
          } else {
            endPosition = null;
          }
          if ($__0[_ensureFly] && startPosition !== null && endPosition != null) {
            $__0[_ensureFly] = false;
            var rectangle = Cesium.Rectangle.fromDegrees(startPosition.lon, startPosition.lat, endPosition.lon, endPosition.lat);
            camera.flyToRectangle({destination: rectangle});
          }
        });
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _bindCesiumWidgetMouseHandlers, {
      value: function() {
        this[_mapEventsHandler].setInputAction(this[_cesiumWidgetMouseDownHandler], Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this[_mapEventsHandler].setInputAction(this[_cesiumWidgetMouseUpHandler], Cesium.ScreenSpaceEventType.LEFT_UP);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _unbindCesiumWidgetMouseHandlers, {
      value: function() {
        this[_mapEventsHandler].removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this[_mapEventsHandler].removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, "start", {
      value: function() {
        this[_map].scene.screenSpaceCameraController.enableRotate = false;
        this[_ensureFly] = false;
        this[_bindCesiumWidgetMouseHandlers]();
        this[_bindMapContainerMouseHandlers]();
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, "stop", {
      value: function() {
        this[_map].scene.screenSpaceCameraController.enableRotate = true;
        this[_unbindMapContainerMouseHandlers]();
        this[_unbindCesiumWidgetMouseHandlers]();
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__2), {}, Tool);
    return ZoomAreaTool;
  }]);
}(window.angular));
//# sourceURL=map-components/tools/zoom-area/zoom-area-tool.js