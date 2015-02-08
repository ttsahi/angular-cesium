"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('ZoomAreaTool', ['Tool', 'Cesium', function(Tool, Cesium) {
    var ZoomAreaTool = function ZoomAreaTool() {
      $traceurRuntime.superConstructor($ZoomAreaTool).apply(this, arguments);
    };
    var $ZoomAreaTool = ZoomAreaTool;
    ($traceurRuntime.createClass)(ZoomAreaTool, {
      _initMapMouseHandlers: function() {
        var $__0 = this;
        var pageX = 0;
        var pageY = 0;
        var startX = 0;
        var startY = 0;
        var deltaX = 0;
        var deltaY = 0;
        var selectedStart = false;
        var selector = angular.element('<div></div>');
        var mapContainer = angular.element(this._map.canvas.parentNode);
        selector.css('border', '2px dashed white');
        mapContainer.on('mousedown', (function(event) {
          pageX = event.pageX;
          pageY = event.pageY;
          startX = event.offsetX;
          startY = event.offsetY;
          $__0._enshureFly = false;
          mapContainer.css('cursor', 'zoom-in');
          selector.css({
            position: 'absolute',
            top: (startY + "px"),
            left: (startX + "px"),
            width: '0px',
            height: '0px'
          });
          mapContainer.append(selector);
          selectedStart = true;
        }));
        mapContainer.on('mousemove', (function(event) {
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
        }));
        mapContainer.on('mouseup', (function(event) {
          selectedStart = false;
          selector.remove();
          mapContainer.css('cursor', '');
          $__0._enshureFly = true;
        }));
        mapContainer.on('mouseleave', (function(event) {
          selectedStart = false;
          mapContainer.css('cursor', '');
          selector.remove();
        }));
      },
      _removeMapMouseHandlers: function() {
        var mapContainer = angular.element(this._map.canvas.parentNode);
        mapContainer.unbind('mousedown');
        mapContainer.unbind('mousemove');
        mapContainer.unbind('mouseup');
        mapContainer.unbind('mouseleave');
      },
      _initCesiumMouseHandlers: function() {
        var $__0 = this;
        var startPosition = null;
        var endPosition = null;
        var camera = this._map.scene.camera;
        var ellipsoid = this._map.scene.globe.ellipsoid;
        var handler = new Cesium.ScreenSpaceEventHandler(this._map.canvas);
        handler.setInputAction((function(movement) {
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
        }), Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.setInputAction((function(movement) {
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
          if ($__0._enshureFly && startPosition !== null && endPosition != null) {
            $__0._enshureFly = false;
            var rectangle = Cesium.Rectangle.fromDegrees(startPosition.lon, startPosition.lat, endPosition.lon, endPosition.lat);
            camera.flyToRectangle({destination: rectangle});
          }
        }), Cesium.ScreenSpaceEventType.LEFT_UP);
      },
      _removeCesiumMouseHandlers: function() {
        var handler = new Cesium.ScreenSpaceEventHandler(this._map.canvas);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
      },
      start: function() {
        this._map.scene.screenSpaceCameraController.enableRotate = false;
        this._enshureFly = false;
        this._initCesiumMouseHandlers();
        this._initMapMouseHandlers();
      },
      stop: function() {
        this._map.scene.screenSpaceCameraController.enableRotate = true;
        this._removeCesiumMouseHandlers();
        this._removeMapMouseHandlers();
      }
    }, {}, Tool);
    return ZoomAreaTool;
  }]);
}(window.angular));
//# sourceURL=map-components/tools/zoom-area/zoom-area-tool.js