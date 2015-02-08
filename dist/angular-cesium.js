"use strict";
angular.module('angularCesium', ['observableCollection']);
//# sourceURL=lib.js
"use strict";
angular.module('angularCesium').service('BillBoardAttributes', function($parse) {
  this.calcAttributes = function(attrs, context) {
    var result = {image: $parse(attrs.image)(context)};
    var positionAttr = $parse(attrs.position)(context);
    result.position = Cesium.Cartesian3.fromDegrees(Number(positionAttr.latitude) || 0, Number(positionAttr.longitude) || 0, Number(positionAttr.altitude) || 0);
    var color = $parse(attrs.color)(context);
    if (color) {
      result.color = Cesium.Color.fromCssColorString(color);
    }
    return result;
  };
});
//# sourceURL=services/billboard-attrs.js
"use strict";
angular.module('angularCesium').factory('Cesium', function() {
  return Cesium;
});
//# sourceURL=services/cesium.js
"use strict";
'use strict';
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('Tool', [function() {
    var Tool = function Tool(map) {
      this._map = map;
    };
    ($traceurRuntime.createClass)(Tool, {
      start: function() {
        throw "No implementation";
      },
      stop: function() {
        throw "No implementation";
      },
      cancel: function() {
        throw "No implementation";
      },
      onUpdate: function() {
        throw "No implementation";
      }
    }, {});
    return Tool;
  }]);
}(window.angular));
//# sourceURL=services/tool.js
"use strict";
angular.module('angularCesium').directive('complexLayer', function($log) {
  return {
    restrict: 'E',
    require: '^map',
    compile: function(element, attrs) {
      if (attrs.observableCollection) {
        angular.forEach(element.children(), function(child) {
          var layer = undefined;
          if (child.tagName === 'BILLBOARD') {
            layer = angular.element('<billboards-layer></billboards-layer>');
          } else if (child.tagName === 'LABEL') {
            layer = angular.element('<labels-layer></labels-layer>');
          }
          if (!layer) {
            $log.warn('Found an unknown child of of complex-layer. Removing...');
            angular.element(child).remove();
          } else {
            angular.forEach(child.attributes, function(attr) {
              layer.attr(attr.name, attr.value);
            });
            angular.forEach(element[0].attributes, function(attr) {
              if (!angular.element(child).attr(attr.name)) {
                layer.attr(attr.name, attr.value);
              }
            });
            angular.element(child).replaceWith(layer);
          }
        });
      }
    }
  };
});
//# sourceURL=map-components/complex-layer/complex-layer.js
"use strict";
angular.module('angularCesium').directive('labelsLayer', function() {
  return {
    restrict: 'E',
    require: '^map',
    scope: {},
    controller: function($scope) {
      this.getLabelCollection = function() {
        return $scope.collection;
      };
    },
    link: {pre: function(scope, element, attrs, mapCtrl) {
        scope.collection = new Cesium.LabelCollection();
        mapCtrl.getCesiumWidget().scene.primitives.add(scope.collection);
        scope.$on('$destroy', function() {
          mapCtrl.getCesiumWidget().scene.primitives.remove(scope.collection);
        });
      }}
  };
});
//# sourceURL=map-components/labels-layer/labels-layer.js
"use strict";
angular.module('angularCesium').directive('billboardsLayer', function($parse, ObservableCollection, BillBoardAttributes, Cesium) {
  return {
    restrict: 'E',
    require: '^map',
    controller: function($scope, $attrs) {
      this.getBillboardCollection = function() {
        if ($attrs.observableCollection) {
          throw new Error('cannot get collection if layer is bound to ObservableCollection');
        }
        return $scope.collection;
      };
    },
    link: {pre: function(scope, element, attrs, mapCtrl) {
        scope.collection = new Cesium.BillboardCollection();
        if (attrs.observableCollection) {
          var COLLECTION_REGEXP = /\s*([\$\w][\$\w]*)\s+in\s+([\$\w][\$\w]*)/;
          var match = attrs.observableCollection.match(COLLECTION_REGEXP);
          var itemName = match[1];
          var collection = $parse(match[2])(scope);
          if (!collection instanceof ObservableCollection) {
            throw new Error('observable-collection must be of type ObservableCollection.');
          } else {
            var addBillboard = function(item) {
              var context = {};
              context[itemName] = item;
              var billDesc = BillBoardAttributes.calcAttributes(attrs, context);
              scope.collection.add(billDesc);
            };
            angular.forEach(collection.getData(), function(item) {
              addBillboard(item);
            });
            collection.onAdd(addBillboard);
            collection.onUpdate(function(item, index) {});
            collection.onRemove(function(item, index) {
              scope.collection.remove(scope.collection.get(index));
            });
          }
        }
        mapCtrl.getCesiumWidget().scene.primitives.add(scope.collection);
        scope.$on('$destroy', function() {
          mapCtrl.getCesiumWidget().scene.primitives.remove(scope.collection);
        });
      }}
  };
});
//# sourceURL=map-components/billboards-layer/billboards-layer.js
"use strict";
angular.module('angularCesium').directive('label', function() {
  return {
    restrict: 'E',
    require: '^labelsLayer',
    scope: {
      color: '&',
      text: '&',
      position: '&'
    },
    link: function(scope, element, attrs, labelsLayerCtrl) {
      var labelDesc = {};
      var position = scope.position();
      labelDesc.position = Cesium.Cartesian3.fromDegrees(Number(position.latitude) || 0, Number(position.longitude) || 0, Number(position.altitude) || 0);
      var color = scope.color();
      if (color) {
        labelDesc.color = color;
      }
      labelDesc.text = scope.text();
      var label = labelsLayerCtrl.getLabelCollection().add(labelDesc);
      scope.$on('$destroy', function() {
        labelsLayerCtrl.getLabelCollection().remove(label);
      });
    }
  };
});
//# sourceURL=map-components/label/label.js
"use strict";
'use strict';
angular.module('angularCesium').directive('map', function() {
  function getSceneMode(dimensions) {
    if (dimensions == 2) {
      return Cesium.SceneMode.SCENE2D;
    } else if (dimensions == 2.5) {
      return Cesium.SceneMode.COLUMBUS_VIEW;
    } else {
      return Cesium.SceneMode.SCENE3D;
    }
  }
  return {
    restrict: 'E',
    template: '<div> <ng-transclude></ng-transclude> <div class="map-container"></div> </div>',
    transclude: true,
    scope: {dimensions: '@'},
    controller: function($scope) {
      this.getCesiumWidget = function() {
        return $scope.cesium;
      };
      $scope.onDrop = function(event) {};
    },
    link: {pre: function(scope, element) {
        if (!scope.dimensions) {
          scope.dimensions = 3;
        }
        scope.cesium = new Cesium.CesiumWidget(element.find('div')[0], {sceneMode: getSceneMode(scope.dimensions)});
        scope.mapRect = element[0].getBoundingClientRect();
      }}
  };
});
//# sourceURL=map-components/map/map-directive.js
"use strict";
angular.module('angularCesium').directive('polyline', function() {
  return {
    restrict: 'E',
    require: '^polylinesLayer',
    scope: {
      color: '&',
      width: '&',
      positions: '&'
    },
    link: function(scope, element, attrs, polylinesLayerCtrl) {
      var polylineDesc = {};
      if (!angular.isDefined(scope.positions) || !angular.isFunction(scope.positions)) {
        throw "Polyline positions must be defined as a function";
      }
      var positions = scope.positions();
      polylineDesc.positions = [];
      angular.forEach(positions, function(position) {
        polylineDesc.positions.push(Cesium.Cartesian3.fromDegrees(Number(position.latitude) || 0, Number(position.longitude) || 0, Number(position.altitude) || 0));
      });
      var cesiumColor = Cesium.Color.fromCssColorString('black');
      if (angular.isDefined(scope.color) && angular.isFunction(scope.color)) {
        cesiumColor = Cesium.Color.fromCssColorString(scope.color());
      }
      polylineDesc.material = Cesium.Material.fromType('Color');
      polylineDesc.material.uniforms.color = cesiumColor;
      polylineDesc.width = 1;
      if (angular.isDefined(scope.width) && angular.isFunction(scope.width)) {
        polylineDesc.width = scope.width();
      }
      var polyline = polylinesLayerCtrl.getPolylineCollection().add(polylineDesc);
      scope.$on('$destroy', function() {
        polylinesLayerCtrl.getPolylineCollection().remove(polyline);
      });
    }
  };
});
//# sourceURL=map-components/polyline/polyline.js
"use strict";
angular.module('angularCesium').directive('polylinesLayer', function() {
  return {
    restrict: 'E',
    require: '^map',
    scope: {},
    controller: function($scope) {
      this.getPolylineCollection = function() {
        return $scope.collection;
      };
    },
    link: {pre: function(scope, element, attrs, mapCtrl) {
        scope.collection = new Cesium.PolylineCollection();
        mapCtrl.getCesiumWidget().scene.primitives.add(scope.collection);
        scope.$on('$destroy', function() {
          mapCtrl.getCesiumWidget().scene.primitives.remove(scope.collection);
        });
      }}
  };
});
//# sourceURL=map-components/polylines-layer/polylines-layer.js
"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').directive('toolBar', [function() {
    return {
      require: '^map',
      controller: ['$scope', function($scope) {
        var currentTool = null;
        this.getCesiumWidget = (function() {
          return $scope.getCesiumWidget();
        });
        this.startTool = function(tool) {
          if (currentTool !== null) {
            currentTool.stop();
          }
          currentTool = tool;
          currentTool.start();
        };
      }],
      link: {pre: function(scope, element, attrs, mapCtrl) {
          scope.getCesiumWidget = mapCtrl.getCesiumWidget;
        }}
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tool/tool-bar.drv.js
"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').directive('tool', ['Tool', function(Tool) {
    return {
      replace: true,
      require: '^toolbar',
      transclude: 'element',
      scope: {type: '='},
      controller: ['$scope', function($scope) {
        this.getTool = (function() {
          return $scope.tool;
        });
      }],
      link: function(scope, element, attrs, toolBarCtrl, linker) {
        if (!(typeof scope.type === 'function')) {
          throw new TypeError("type attr must be constructor.");
        }
        var tool = new scope.type(toolBarCtrl.getCesiumWidget());
        if (!(tool instanceof Tool)) {
          throw new TypeError("tool must be instance of Tool.");
        }
        var proxy = {};
        var $__1 = function(key) {
          if (key === 'start') {
            return 0;
          }
          Object.defineProperty(proxy, key, {
            get: (function() {
              return tool[key];
            }),
            set: (function(val) {
              tool[key] = val;
            })
          });
        },
            $__2;
        $__0: for (var key in tool) {
          $__2 = $__1(key);
          switch ($__2) {
            case 0:
              continue $__0;
          }
        }
        Object.defineProperty(proxy, 'start', {get: (function() {
            return (function() {
              return toolBarCtrl.startTool(tool);
            });
          })});
        scope.tool = proxy;
        linker(scope, (function(clone) {
          element.parent().append(clone);
        }));
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tool/tool.drv.js
"use strict";
angular.module('angularCesium').directive('billboard', function(BillBoardAttributes) {
  return {
    restrict: 'E',
    require: '^billboardsLayer',
    link: function(scope, element, attrs, billboardsLayerCtrl) {
      var billDesc = BillBoardAttributes.calcAttributes(attrs, scope);
      var billboard = billboardsLayerCtrl.getBillboardCollection().add(billDesc);
      scope.$on('$destroy', function() {
        billboardsLayerCtrl.getBillboardCollection().remove(billboard);
      });
    }
  };
});
//# sourceURL=map-components/billboard/billboard.js
"use strict";
'use strict';
angular.module('angularCesium').directive('draggable', ['$document', function($document) {
  return function(scope, element, attr) {
    var startX = 0,
        startY = 0,
        x = 0,
        y = 0,
        x1 = 0,
        y1 = 0,
        offsetTop = -1,
        offsetLeft = -1;
    var mapRect = scope.$parent.mapRect,
        newMapRect = {},
        elemRect = {};
    var toolbar = element.parent();
    element.on('mousedown', function(event) {
      event.preventDefault();
      if (offsetTop == -1) {
        offsetTop = toolbar[0].offsetTop;
        offsetLeft = toolbar[0].offsetLeft;
        newMapRect.top = offsetTop + mapRect.top;
        newMapRect.left = offsetLeft + mapRect.left;
        newMapRect.right = offsetLeft + mapRect.right - 5;
        newMapRect.bottom = offsetTop + mapRect.bottom - 15;
        elemRect = toolbar[0].getBoundingClientRect();
        console.log('draggable2', newMapRect);
      } else {
        offsetTop = 0;
        offsetLeft = 0;
      }
      startX = event.pageX - x - offsetLeft;
      startY = event.pageY - y - offsetTop;
      element.css({cursor: '-webkit-grabbing'});
      $document.on('mousemove', mousemove);
      $document.on('mouseup', mouseup);
    });
    function mousemove(event) {
      y = event.pageY - startY;
      x = event.pageX - startX;
      if (!insideMap()) {
        toolbar.css({
          top: y1 + 'px',
          left: x1 + 'px'
        });
      } else {
        x1 = x;
        y1 = y;
      }
    }
    function mouseup() {
      element.css({cursor: '-webkit-grab'});
      $document.off('mousemove', mousemove);
      $document.off('mouseup', mouseup);
    }
    function insideMap() {
      toolbar.css({
        top: y + 'px',
        left: x + 'px'
      });
      elemRect = toolbar[0].getBoundingClientRect();
      if (elemRect.top < newMapRect.top || elemRect.left < newMapRect.left || elemRect.right > newMapRect.right || elemRect.bottom > newMapRect.bottom) {
        return false;
      }
      return true;
    }
  };
}]);
//# sourceURL=map-components/toolbar/draggable.js
"use strict";
'use strict';
angular.module('angularCesium').directive('toolbar', function() {
  return {
    restrict: 'E',
    template: '<div class="toolbar" ><div class="drag-button glyphicon glyphicon-minus" draggable></div> <ng-transclude></ng-transclude></div>',
    transclude: true,
    require: '^map',
    controller: function($scope) {
      var currentTool = null;
      this.getCesiumWidget = (function() {
        return $scope.getCesiumWidget();
      });
      this.startTool = function(tool) {
        if (currentTool !== null) {
          currentTool.stop();
        }
        currentTool = tool;
        currentTool.start();
      };
    },
    link: {pre: function(scope, element, attrs, mapCtrl) {
        scope.getCesiumWidget = mapCtrl.getCesiumWidget;
      }}
  };
});
//# sourceURL=map-components/toolbar/toolbar.js
"use strict";
'use strict';
angular.module('angularCesium').directive('webMapServiceLayer', function() {
  return {
    restrict: 'E',
    require: '^map',
    scope: {
      url: '&',
      layers: '&'
    },
    controller: function($scope) {},
    link: function(scope, element, attrs, mapCtrl) {
      var provider = new Cesium.WebMapServiceImageryProvider({
        url: scope.url(),
        layers: scope.layers()
      });
      var layer = mapCtrl.getCesiumWidget().scene.imageryLayers.addImageryProvider(provider);
      scope.$on('$destroy', function() {
        mapCtrl.getCesiumWidget().scene.imageryLayers.remove(layer);
      });
    }
  };
});
//# sourceURL=map-components/web-map-service-layer/web-map-service-layer.js
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
"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('ZoomTool', ['Tool', function(Tool) {
    var ZoomTool = function ZoomTool(map) {
      this._camera = map.scene.camera;
      this._ellipsoid = map.scene.globe.ellipsoid;
    };
    ($traceurRuntime.createClass)(ZoomTool, {
      start: function() {
        return true;
      },
      stop: function() {
        return true;
      },
      zoomIn: function(jumps) {
        jumps = Number.isFinite(jumps) ? jumps : 1;
        for (var i = 0; i < jumps; i++) {
          var cameraHeight = this._ellipsoid.cartesianToCartographic(this._camera.position).height;
          var moveRate = cameraHeight / 100.0;
          this._camera.moveForward(moveRate);
        }
      },
      zoomOut: function(jumps) {
        jumps = Number.isFinite(jumps) ? jumps : 1;
        for (var i = 0; i < jumps; i++) {
          var cameraHeight = this._ellipsoid.cartesianToCartographic(this._camera.position).height;
          var moveRate = cameraHeight / 100.0;
          this._camera.moveBackward(moveRate);
        }
      }
    }, {}, Tool);
    return ZoomTool;
  }]);
}(window.angular));
//# sourceURL=map-components/tools/zoom/zoom-tool.js
"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').directive('zoomWidget', ['$document', function($document) {
    return {
      replace: true,
      require: '^tool',
      template: '<div class="zoom-widget">' + '<div class="zoom-in-btn">' + '<button type="button" class="btn btn-default" ng-click="zoomIn();">' + '<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>' + '</button>' + '</div>' + '<div class="slider">' + '<span class="bar">' + '</span>' + '<span class="pointer">' + '</span>' + '</div>' + '<div class="zoom-out-btn">' + '<button type="button" class="btn btn-default" ng-click="zoomOut();">' + '<span class="glyphicon glyphicon-zoom-out" aria-hidden="true"></span>' + '</button>' + '</div>' + '</div>',
      link: function(scope, element, attrs, toolCtrl) {
        if (isFinite(attrs.width) || isFinite(attrs.height)) {
          var width = isFinite(attrs.width) ? Number.parseInt(attrs.width) + 'px' : 'inherit';
          var height = isFinite(attrs.height) ? Number.parseInt(attrs.height) + 'px' : 'inherit';
          element.css({
            position: 'relative',
            width: width,
            height: height
          });
        }
        var minLevel = isFinite(attrs.min) ? Number.parseInt(attrs.min) : 0;
        var maxLevel = isFinite(attrs.max) ? Number.parseInt(attrs.max) : 100;
        if (minLevel < 0 || maxLevel < 0 || minLevel >= maxLevel) {
          throw new Error("min or max attributes value are invalid.");
        }
        var jumps = isFinite(attrs.jump) ? Number.parseInt(attrs.jump) : 10;
        var zoomTool = toolCtrl.getTool();
        if ((typeof zoomTool.zoomIn !== 'function') || (typeof zoomTool.zoomOut !== 'function')) {
          throw new TypeError("Zoom widget must be inside tool with ZoomTool type.");
        }
        var levelValue = 90 / (maxLevel - minLevel);
        var currentLevel = (maxLevel - minLevel) / 2;
        var zoomLevel = (maxLevel + minLevel) / 2;
        var tempLevel = zoomLevel;
        var currentPointerHeight = 45;
        var pointer = angular.element(element.find('span')[2]);
        pointer.css('top', currentLevel * levelValue + '%');
        var clientY = null;
        var barHeight = pointer[0].clientHeight * 10;
        var startPointerHeight = currentPointerHeight;
        pointer.on('mousedown', (function(event) {
          event.preventDefault();
          clientY = event.clientY;
          startPointerHeight = currentPointerHeight;
          tempLevel = zoomLevel;
          pointer.addClass('active');
        }));
        $document.on('mouseup', (function(event) {
          if (clientY !== null) {
            clientY = null;
            pointer.removeClass('active');
          }
        }));
        $document.on('mousemove', (function(event) {
          if (clientY !== null) {
            var deltaY = clientY - event.clientY;
            var percent = (Math.abs(deltaY) * 100 / barHeight);
            if (deltaY > 0) {
              if (startPointerHeight - percent >= 0) {
                currentPointerHeight = startPointerHeight - percent;
              } else {
                currentPointerHeight = 0;
              }
            } else {
              if (startPointerHeight + percent <= 90) {
                currentPointerHeight = startPointerHeight + percent;
              } else {
                currentPointerHeight = 90;
              }
            }
            currentLevel = Math.trunc(currentPointerHeight / levelValue);
            zoomLevel = maxLevel - currentLevel;
            if (zoomLevel > tempLevel) {
              zoomTool.zoomIn((zoomLevel - tempLevel) * jumps);
            }
            if (zoomLevel < tempLevel) {
              zoomTool.zoomOut((tempLevel - zoomLevel) * jumps);
            }
            tempLevel = zoomLevel;
            pointer.css('top', currentLevel * levelValue + '%');
          }
        }));
        scope.zoomIn = function() {
          if (zoomLevel < maxLevel) {
            zoomLevel++;
            currentLevel--;
            currentPointerHeight = currentLevel * levelValue;
            pointer.css('top', currentPointerHeight + '%');
            zoomTool.zoomIn(jumps);
          }
        };
        scope.zoomOut = function() {
          if (zoomLevel > minLevel) {
            zoomLevel--;
            currentLevel++;
            currentPointerHeight = currentLevel * levelValue;
            pointer.css('top', currentPointerHeight + '%');
            zoomTool.zoomOut(jumps);
          }
        };
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tools/zoom/zoom-widget.drv.js
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Rvb2wuanMiLCJtYXAtY29tcG9uZW50cy9jb21wbGV4LWxheWVyL2NvbXBsZXgtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9sYWJlbHMtbGF5ZXIvbGFiZWxzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvYmlsbGJvYXJkcy1sYXllci9iaWxsYm9hcmRzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbGFiZWwvbGFiZWwuanMiLCJtYXAtY29tcG9uZW50cy9tYXAvbWFwLWRpcmVjdGl2ZS5qcyIsIm1hcC1jb21wb25lbnRzL3BvbHlsaW5lL3BvbHlsaW5lLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmVzLWxheWVyL3BvbHlsaW5lcy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC1iYXIuZHJ2LmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbC90b29sLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL2JpbGxib2FyZC9iaWxsYm9hcmQuanMiLCJtYXAtY29tcG9uZW50cy90b29sYmFyL2RyYWdnYWJsZS5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xiYXIvdG9vbGJhci5qcyIsIm1hcC1jb21wb25lbnRzL3dlYi1tYXAtc2VydmljZS1sYXllci93ZWItbWFwLXNlcnZpY2UtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tLWFyZWEvem9vbS1hcmVhLXRvb2wuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tL3pvb20tdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS13aWRnZXQuZHJ2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYW5ndWxhci1jZXNpdW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nLCBbJ29ic2VydmFibGVDb2xsZWN0aW9uJ10pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTAvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLnNlcnZpY2UoJ0JpbGxCb2FyZEF0dHJpYnV0ZXMnLCBmdW5jdGlvbigkcGFyc2UpIHtcclxuICB0aGlzLmNhbGNBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMsIGNvbnRleHQpIHtcclxuICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgIGltYWdlIDogJHBhcnNlKGF0dHJzLmltYWdlKShjb250ZXh0KVxyXG4gICAgfTtcclxuICAgIHZhciBwb3NpdGlvbkF0dHIgPSAkcGFyc2UoYXR0cnMucG9zaXRpb24pKGNvbnRleHQpO1xyXG4gICAgcmVzdWx0LnBvc2l0aW9uID0gQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uQXR0ci5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uQXR0ci5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIuYWx0aXR1ZGUpIHx8IDApO1xyXG5cclxuICAgIHZhciBjb2xvciA9ICRwYXJzZShhdHRycy5jb2xvcikoY29udGV4dCk7XHJcbiAgICBpZiAoY29sb3IpIHtcclxuICAgICAgcmVzdWx0LmNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZyhjb2xvcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdDZXNpdW0nLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gQ2VzaXVtO1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdUb29sJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgIGNsYXNzIFRvb2wge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKG1hcCl7IHRoaXMuX21hcCA9IG1hcDsgfVxyXG4gICAgICAgIHN0YXJ0KCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxyXG4gICAgICAgIHN0b3AoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiOyB9XHJcbiAgICAgICAgY2FuY2VsKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjt9XHJcbiAgICAgICAgb25VcGRhdGUoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTcvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnY29tcGxleExheWVyJywgZnVuY3Rpb24oJGxvZykge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb21waWxlIDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgaWYgKGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnQuY2hpbGRyZW4oKSwgZnVuY3Rpb24gKGNoaWxkKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGxheWVyID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgIGlmIChjaGlsZC50YWdOYW1lID09PSAnQklMTEJPQVJEJykge1xyXG4gICAgICAgICAgICBsYXllciA9IGFuZ3VsYXIuZWxlbWVudCgnPGJpbGxib2FyZHMtbGF5ZXI+PC9iaWxsYm9hcmRzLWxheWVyPicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoY2hpbGQudGFnTmFtZSA9PT0gJ0xBQkVMJykge1xyXG4gICAgICAgICAgICBsYXllciA9IGFuZ3VsYXIuZWxlbWVudCgnPGxhYmVscy1sYXllcj48L2xhYmVscy1sYXllcj4nKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIWxheWVyKSB7XHJcbiAgICAgICAgICAgICRsb2cud2FybignRm91bmQgYW4gdW5rbm93biBjaGlsZCBvZiBvZiBjb21wbGV4LWxheWVyLiBSZW1vdmluZy4uLicpO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjaGlsZC5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG4gICAgICAgICAgICAgIGxheWVyLmF0dHIoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50WzBdLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdHRyKSB7XHJcbiAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLmF0dHIoYXR0ci5uYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuYXR0cihhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChjaGlsZCkucmVwbGFjZVdpdGgobGF5ZXIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsc0xheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge30sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuZ2V0TGFiZWxDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uTGFiZWxDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2JpbGxib2FyZHNMYXllcicsIGZ1bmN0aW9uKCRwYXJzZSwgT2JzZXJ2YWJsZUNvbGxlY3Rpb24sIEJpbGxCb2FyZEF0dHJpYnV0ZXMsIENlc2l1bSkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlLCAkYXR0cnMpIHtcclxuICAgICAgdGhpcy5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCRhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZ2V0IGNvbGxlY3Rpb24gaWYgbGF5ZXIgaXMgYm91bmQgdG8gT2JzZXJ2YWJsZUNvbGxlY3Rpb24nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY29sbGVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICAgIHNjb3BlLmNvbGxlY3Rpb24gPSBuZXcgQ2VzaXVtLkJpbGxib2FyZENvbGxlY3Rpb24oKTtcclxuICAgICAgICBpZiAoYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgIHZhciBDT0xMRUNUSU9OX1JFR0VYUCA9IC9cXHMqKFtcXCRcXHddW1xcJFxcd10qKVxccytpblxccysoW1xcJFxcd11bXFwkXFx3XSopLztcclxuICAgICAgICAgIHZhciBtYXRjaCA9IGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uLm1hdGNoKENPTExFQ1RJT05fUkVHRVhQKTtcclxuICAgICAgICAgIHZhciBpdGVtTmFtZSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgdmFyIGNvbGxlY3Rpb24gPSAkcGFyc2UobWF0Y2hbMl0pKHNjb3BlKTtcclxuICAgICAgICAgIGlmICghY29sbGVjdGlvbiBpbnN0YW5jZW9mIE9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb2JzZXJ2YWJsZS1jb2xsZWN0aW9uIG11c3QgYmUgb2YgdHlwZSBPYnNlcnZhYmxlQ29sbGVjdGlvbi4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYWRkQmlsbGJvYXJkID0gZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgIHZhciBjb250ZXh0ID0ge307XHJcbiAgICAgICAgICAgICAgY29udGV4dFtpdGVtTmFtZV0gPSBpdGVtO1xyXG4gICAgICAgICAgICAgIHZhciBiaWxsRGVzYyA9IEJpbGxCb2FyZEF0dHJpYnV0ZXMuY2FsY0F0dHJpYnV0ZXMoYXR0cnMsIGNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICBzY29wZS5jb2xsZWN0aW9uLmFkZChiaWxsRGVzYyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY29sbGVjdGlvbi5nZXREYXRhKCksIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICBhZGRCaWxsYm9hcmQoaXRlbSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25BZGQoYWRkQmlsbGJvYXJkKTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vblVwZGF0ZShmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25SZW1vdmUoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgICBzY29wZS5jb2xsZWN0aW9uLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uLmdldChpbmRleCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5hZGQoc2NvcGUuY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdsYWJlbCcsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmxhYmVsc0xheWVyJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBjb2xvciA6ICcmJyxcclxuICAgICAgdGV4dCA6ICcmJyxcclxuICAgICAgcG9zaXRpb24gOiAnJidcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBsYWJlbHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGxhYmVsRGVzYyA9IHt9O1xyXG5cclxuICAgICAgdmFyIHBvc2l0aW9uID0gc2NvcGUucG9zaXRpb24oKTtcclxuICAgICAgbGFiZWxEZXNjLnBvc2l0aW9uID0gQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24ubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24uYWx0aXR1ZGUpIHx8IDApO1xyXG5cclxuICAgICAgdmFyIGNvbG9yID0gc2NvcGUuY29sb3IoKTtcclxuICAgICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgICAgbGFiZWxEZXNjLmNvbG9yID0gY29sb3I7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxhYmVsRGVzYy50ZXh0ID0gc2NvcGUudGV4dCgpO1xyXG5cclxuICAgICAgdmFyIGxhYmVsID0gbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLmFkZChsYWJlbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxhYmVsc0xheWVyQ3RybC5nZXRMYWJlbENvbGxlY3Rpb24oKS5yZW1vdmUobGFiZWwpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ21hcCcsIGZ1bmN0aW9uKCkge1xyXG4gIGZ1bmN0aW9uIGdldFNjZW5lTW9kZShkaW1lbnNpb25zKSB7XHJcbiAgICBpZiAoZGltZW5zaW9ucyA9PSAyKSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FMkQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChkaW1lbnNpb25zID09IDIuNSkge1xyXG4gICAgICByZXR1cm4gQ2VzaXVtLlNjZW5lTW9kZS5DT0xVTUJVU19WSUVXO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FM0Q7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdj4gPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPiA8ZGl2IGNsYXNzPVwibWFwLWNvbnRhaW5lclwiPjwvZGl2PiA8L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgZGltZW5zaW9ucyA6ICdAJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNlc2l1bTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLm9uRHJvcCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAoIXNjb3BlLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICAgIHNjb3BlLmRpbWVuc2lvbnMgPSAzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NvcGUuY2VzaXVtID0gbmV3IENlc2l1bS5DZXNpdW1XaWRnZXQoZWxlbWVudC5maW5kKCdkaXYnKVswXSwge1xyXG4gICAgICAgICAgc2NlbmVNb2RlOiBnZXRTY2VuZU1vZGUoc2NvcGUuZGltZW5zaW9ucylcclxuICAgICAgICB9KTtcclxuICAgICAgICBzY29wZS5tYXBSZWN0ID0gZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBnaWxuaXMyIG9uIDE4LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3BvbHlsaW5lJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdecG9seWxpbmVzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB3aWR0aCA6ICcmJyxcclxuICAgICAgcG9zaXRpb25zIDogJyYnXHJcbiAgICB9LFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgcG9seWxpbmVzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBwb2x5bGluZURlc2MgPSB7fTtcclxuXHJcbiAgICAgIGlmICghYW5ndWxhci5pc0RlZmluZWQoc2NvcGUucG9zaXRpb25zKSB8fCAhYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLnBvc2l0aW9ucykpe1xyXG4gICAgICAgIHRocm93IFwiUG9seWxpbmUgcG9zaXRpb25zIG11c3QgYmUgZGVmaW5lZCBhcyBhIGZ1bmN0aW9uXCI7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHBvc2l0aW9ucyA9IHNjb3BlLnBvc2l0aW9ucygpO1xyXG4gICAgICBwb2x5bGluZURlc2MucG9zaXRpb25zID0gW107XHJcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChwb3NpdGlvbnMsIGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcG9seWxpbmVEZXNjLnBvc2l0aW9ucy5wdXNoKENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbi5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmxvbmdpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmFsdGl0dWRlKSB8fCAwKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNlc2l1bUNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZygnYmxhY2snKTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLmNvbG9yKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUuY29sb3IpKXtcclxuICAgICAgICBjZXNpdW1Db2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoc2NvcGUuY29sb3IoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICBwb2x5bGluZURlc2MubWF0ZXJpYWwgPSBDZXNpdW0uTWF0ZXJpYWwuZnJvbVR5cGUoJ0NvbG9yJyk7XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5tYXRlcmlhbC51bmlmb3Jtcy5jb2xvciA9IGNlc2l1bUNvbG9yO1xyXG5cclxuICAgICAgcG9seWxpbmVEZXNjLndpZHRoID0gMTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLndpZHRoKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUud2lkdGgpKXtcclxuICAgICAgICBwb2x5bGluZURlc2Mud2lkdGggPSBzY29wZS53aWR0aCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcG9seWxpbmUgPSBwb2x5bGluZXNMYXllckN0cmwuZ2V0UG9seWxpbmVDb2xsZWN0aW9uKCkuYWRkKHBvbHlsaW5lRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcG9seWxpbmVzTGF5ZXJDdHJsLmdldFBvbHlsaW5lQ29sbGVjdGlvbigpLnJlbW92ZShwb2x5bGluZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmVzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRQb2x5bGluZUNvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5Qb2x5bGluZUNvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sQmFyJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXF1aXJlOiAnXm1hcCcsXHJcbiAgICAgICAgLy90cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgIC8vdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU9XCJcIj48L2Rpdj4nLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJyxcclxuICAgICAgICAgIGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbGluazoge1xyXG4gICAgICAgICAgcHJlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpe1xyXG4gICAgICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sJywgWydUb29sJyxcclxuICAgIGZ1bmN0aW9uKFRvb2wpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZTogJ150b29sYmFyJyxcclxuICAgICAgICB0cmFuc2NsdWRlOiAnZWxlbWVudCcsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgIHR5cGU6ICc9J1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLFxyXG4gICAgICAgICAgZnVuY3Rpb24oJHNjb3BlKXtcclxuICAgICAgICAgICAgdGhpcy5nZXRUb29sID0gKCkgPT4gJHNjb3BlLnRvb2w7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xCYXJDdHJsLCBsaW5rZXIpe1xyXG4gICAgICAgICAgaWYoISh0eXBlb2Ygc2NvcGUudHlwZSA9PT0gJ2Z1bmN0aW9uJykpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidHlwZSBhdHRyIG11c3QgYmUgY29uc3RydWN0b3IuXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCB0b29sID0gbmV3IHNjb3BlLnR5cGUodG9vbEJhckN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkpO1xyXG5cclxuICAgICAgICAgIGlmKCEodG9vbCBpbnN0YW5jZW9mIFRvb2wpKXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRvb2wgbXVzdCBiZSBpbnN0YW5jZSBvZiBUb29sLlwiKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgcHJveHkgPSB7fTtcclxuXHJcbiAgICAgICAgICBmb3IobGV0IGtleSBpbiB0b29sKXtcclxuICAgICAgICAgICAgaWYoa2V5ID09PSAnc3RhcnQnKXtcclxuICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksIGtleSwge1xyXG4gICAgICAgICAgICAgIGdldDogKCkgPT4gdG9vbFtrZXldLFxyXG4gICAgICAgICAgICAgIHNldDogdmFsID0+IHsgdG9vbFtrZXldID0gdmFsOyB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwgJ3N0YXJ0Jywge1xyXG4gICAgICAgICAgICBnZXQ6ICgpID0+ICgpID0+IHRvb2xCYXJDdHJsLnN0YXJ0VG9vbCh0b29sKVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgc2NvcGUudG9vbCA9IHByb3h5O1xyXG5cclxuICAgICAgICAgIGxpbmtlcihzY29wZSwgKGNsb25lKSA9PiB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQucGFyZW50KCkuYXBwZW5kKGNsb25lKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdiaWxsYm9hcmQnLCBmdW5jdGlvbihCaWxsQm9hcmRBdHRyaWJ1dGVzKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdeYmlsbGJvYXJkc0xheWVyJyxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGJpbGxib2FyZHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgc2NvcGUpO1xyXG5cclxuICAgICAgdmFyIGJpbGxib2FyZCA9IGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLmFkZChiaWxsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgYmlsbGJvYXJkc0xheWVyQ3RybC5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uKCkucmVtb3ZlKGJpbGxib2FyZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGVyZXp5IG9uIDIvMS8yMDE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKVxyXG4gIC5kaXJlY3RpdmUoJ2RyYWdnYWJsZScsIFsnJGRvY3VtZW50JywgZnVuY3Rpb24oJGRvY3VtZW50KSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcclxuICAgICAgdmFyIHN0YXJ0WCA9IDAsIHN0YXJ0WSA9IDAsIHggPSAwLCB5ID0gMCwgIHgxID0gMCwgeTEgPSAwLCBvZmZzZXRUb3AgPSAtMSxvZmZzZXRMZWZ0ID0gLTE7XHJcbiAgICAgIHZhciBtYXBSZWN0ID0gc2NvcGUuJHBhcmVudC5tYXBSZWN0LG5ld01hcFJlY3QgPSB7fSwgZWxlbVJlY3QgPSB7fTtcclxuICAgICAgdmFyIHRvb2xiYXIgPSBlbGVtZW50LnBhcmVudCgpO1xyXG4gICAgICBlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdCBkcmFnZ2luZyBvZiBzZWxlY3RlZCBjb250ZW50XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZihvZmZzZXRUb3AgPT0gLTEpe1xyXG4gICAgICAgICAgb2Zmc2V0VG9wID0gdG9vbGJhclswXS5vZmZzZXRUb3A7XHJcbiAgICAgICAgICBvZmZzZXRMZWZ0ID0gdG9vbGJhclswXS5vZmZzZXRMZWZ0O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC50b3AgPSBvZmZzZXRUb3AgKyBtYXBSZWN0LnRvcDtcclxuICAgICAgICAgIG5ld01hcFJlY3QubGVmdCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LmxlZnQ7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LnJpZ2h0ID0gb2Zmc2V0TGVmdCArIG1hcFJlY3QucmlnaHQgLSA1O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC5ib3R0b20gPSBvZmZzZXRUb3AgKyBtYXBSZWN0LmJvdHRvbSAtIDE1O1xyXG4gICAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ2RyYWdnYWJsZTInLG5ld01hcFJlY3QpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgb2Zmc2V0VG9wID0gMDtcclxuICAgICAgICAgIG9mZnNldExlZnQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGFydFggPSBldmVudC5wYWdlWCAtIHggLSBvZmZzZXRMZWZ0O1xyXG4gICAgICAgIHN0YXJ0WSA9IGV2ZW50LnBhZ2VZIC0geSAtIG9mZnNldFRvcDtcclxuICAgICAgICBlbGVtZW50LmNzcyh7XHJcbiAgICAgICAgICBjdXJzb3I6ICctd2Via2l0LWdyYWJiaW5nJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcclxuICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3VzZW1vdmUoZXZlbnQpIHtcclxuICAgICAgICB5ID0gZXZlbnQucGFnZVkgLSBzdGFydFk7XHJcbiAgICAgICAgeCA9IGV2ZW50LnBhZ2VYIC0gc3RhcnRYO1xyXG5cclxuICAgICAgICBpZighaW5zaWRlTWFwKCkpIHtcclxuICAgICAgICAgIHRvb2xiYXIuY3NzKHtcclxuICAgICAgICAgICAgdG9wOiB5MSArICdweCcsXHJcbiAgICAgICAgICAgIGxlZnQ6IHgxICsgJ3B4J1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICB4MSA9IHg7XHJcbiAgICAgICAgICB5MSA9IHk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3VzZXVwKCkge1xyXG4gICAgICAgIGVsZW1lbnQuY3NzKHtcclxuICAgICAgICAgIGN1cnNvcjogJy13ZWJraXQtZ3JhYidcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZG9jdW1lbnQub2ZmKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xyXG4gICAgICAgICRkb2N1bWVudC5vZmYoJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gaW5zaWRlTWFwKCl7XHJcbiAgICAgICAgdG9vbGJhci5jc3Moe1xyXG4gICAgICAgICAgdG9wOiB5ICsgJ3B4JyxcclxuICAgICAgICAgIGxlZnQ6IHggKyAncHgnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGlmKGVsZW1SZWN0LnRvcCA8IG5ld01hcFJlY3QudG9wIHx8IGVsZW1SZWN0LmxlZnQgPCBuZXdNYXBSZWN0LmxlZnQgfHwgZWxlbVJlY3QucmlnaHQgPiBuZXdNYXBSZWN0LnJpZ2h0IHx8IGVsZW1SZWN0LmJvdHRvbSA+IG5ld01hcFJlY3QuYm90dG9tKXtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfV0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBlcmV6eSBvbiAwMS8wMi8xNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sYmFyJywgZnVuY3Rpb24oKSB7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHRlbXBsYXRlIDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyXCIgPjxkaXYgY2xhc3M9XCJkcmFnLWJ1dHRvbiBnbHlwaGljb24gZ2x5cGhpY29uLW1pbnVzXCIgZHJhZ2dhYmxlPjwvZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcclxuICAgIHRyYW5zY2x1ZGUgOiB0cnVlLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgbGV0IGN1cnJlbnRUb29sID0gbnVsbDtcclxuXHJcbiAgICAgIHRoaXMuZ2V0Q2VzaXVtV2lkZ2V0ID0gKCkgPT4gJHNjb3BlLmdldENlc2l1bVdpZGdldCgpO1xyXG5cclxuICAgICAgdGhpcy5zdGFydFRvb2wgPSBmdW5jdGlvbih0b29sKXtcclxuICAgICAgICBpZihjdXJyZW50VG9vbCAhPT0gbnVsbCl7XHJcbiAgICAgICAgICBjdXJyZW50VG9vbC5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdXJyZW50VG9vbCA9IHRvb2w7XHJcbiAgICAgICAgY3VycmVudFRvb2wuc3RhcnQoKTtcclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCl7XHJcbiAgICAgICAgc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0ID0gbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd3ZWJNYXBTZXJ2aWNlTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIHVybCA6ICcmJyxcclxuICAgICAgbGF5ZXJzIDogJyYnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgdmFyIHByb3ZpZGVyID0gbmV3IENlc2l1bS5XZWJNYXBTZXJ2aWNlSW1hZ2VyeVByb3ZpZGVyKHtcclxuICAgICAgICB1cmw6IHNjb3BlLnVybCgpLFxyXG4gICAgICAgIGxheWVycyA6IHNjb3BlLmxheWVycygpXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGxheWVyID0gbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLmFkZEltYWdlcnlQcm92aWRlcihwcm92aWRlcik7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLnJlbW92ZShsYXllcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwNS8wMi8xNS5cbiAqL1xuXG4oZnVuY3Rpb24oYW5ndWxhcil7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnWm9vbUFyZWFUb29sJywgWydUb29sJywgJ0Nlc2l1bScsXG4gICAgZnVuY3Rpb24oVG9vbCwgQ2VzaXVtKXtcblxuICAgICAgY2xhc3MgWm9vbUFyZWFUb29sIGV4dGVuZHMgVG9vbCB7XG5cbiAgICAgICAgX2luaXRNYXBNb3VzZUhhbmRsZXJzKCl7XG4gICAgICAgICAgbGV0IHBhZ2VYID0gMDtcbiAgICAgICAgICBsZXQgcGFnZVkgPSAwO1xuICAgICAgICAgIGxldCBzdGFydFggPSAwO1xuICAgICAgICAgIGxldCBzdGFydFkgPSAwO1xuICAgICAgICAgIGxldCBkZWx0YVggPSAwO1xuICAgICAgICAgIGxldCBkZWx0YVkgPSAwO1xuICAgICAgICAgIGxldCBzZWxlY3RlZFN0YXJ0ID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHNlbGVjdG9yID0gYW5ndWxhci5lbGVtZW50KCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICAgIGxldCBtYXBDb250YWluZXIgPSBhbmd1bGFyLmVsZW1lbnQodGhpcy5fbWFwLmNhbnZhcy5wYXJlbnROb2RlKTtcblxuICAgICAgICAgIHNlbGVjdG9yLmNzcygnYm9yZGVyJywgJzJweCBkYXNoZWQgd2hpdGUnKTtcblxuICAgICAgICAgIG1hcENvbnRhaW5lci5vbignbW91c2Vkb3duJywgZXZlbnQgPT4ge1xuICAgICAgICAgICAgcGFnZVggPSBldmVudC5wYWdlWDtcbiAgICAgICAgICAgIHBhZ2VZID0gZXZlbnQucGFnZVk7XG4gICAgICAgICAgICBzdGFydFggPSBldmVudC5vZmZzZXRYO1xuICAgICAgICAgICAgc3RhcnRZID0gZXZlbnQub2Zmc2V0WTtcbiAgICAgICAgICAgIHRoaXMuX2Vuc2h1cmVGbHkgPSBmYWxzZTtcbiAgICAgICAgICAgIG1hcENvbnRhaW5lci5jc3MoJ2N1cnNvcicsICd6b29tLWluJyk7XG5cbiAgICAgICAgICAgIHNlbGVjdG9yLmNzcyh7XG4gICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICB0b3A6IGAke3N0YXJ0WX1weGAsXG4gICAgICAgICAgICAgIGxlZnQ6IGAke3N0YXJ0WH1weGAsXG4gICAgICAgICAgICAgIHdpZHRoOiAnMHB4JyxcbiAgICAgICAgICAgICAgaGVpZ2h0OiAnMHB4J1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1hcENvbnRhaW5lci5hcHBlbmQoc2VsZWN0b3IpO1xuICAgICAgICAgICAgc2VsZWN0ZWRTdGFydCA9IHRydWU7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBtYXBDb250YWluZXIub24oJ21vdXNlbW92ZScsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGlmKCFzZWxlY3RlZFN0YXJ0KXtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWx0YVggPSAgZXZlbnQucGFnZVggLSBwYWdlWDtcbiAgICAgICAgICAgIGRlbHRhWSA9IGV2ZW50LnBhZ2VZIC0gcGFnZVk7XG5cbiAgICAgICAgICAgIGxldCBzZWxlY3RvclN0eWxlID0ge307XG5cbiAgICAgICAgICAgIGlmKGRlbHRhWCA+IDApe1xuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLndpZHRoID0gYCR7ZGVsdGFYfXB4YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRlbHRhWCA8IDApe1xuICAgICAgICAgICAgICBkZWx0YVggPSBNYXRoLmFicyhkZWx0YVgpO1xuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLndpZHRoID0gYCR7ZGVsdGFYfXB4YDtcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS5sZWZ0ID0gYCR7c3RhcnRYIC0gZGVsdGFYfXB4YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRlbHRhWSA+IDApe1xuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLmhlaWdodCA9IGAke2RlbHRhWX1weGA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkZWx0YVkgPCAwKXtcbiAgICAgICAgICAgICAgZGVsdGFZID0gTWF0aC5hYnMoZGVsdGFZKTtcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS5oZWlnaHQgPSBgJHtkZWx0YVl9cHhgO1xuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLnRvcCA9IGAke3N0YXJ0WSAtIGRlbHRhWX1weGA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGVjdG9yLmNzcyhzZWxlY3RvclN0eWxlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG1hcENvbnRhaW5lci5vbignbW91c2V1cCcsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNlbGVjdG9yLnJlbW92ZSgpO1xuICAgICAgICAgICAgbWFwQ29udGFpbmVyLmNzcygnY3Vyc29yJywgJycpO1xuICAgICAgICAgICAgdGhpcy5fZW5zaHVyZUZseSA9IHRydWU7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBtYXBDb250YWluZXIub24oJ21vdXNlbGVhdmUnLCBldmVudCA9PiB7XG4gICAgICAgICAgICBzZWxlY3RlZFN0YXJ0ID0gZmFsc2U7XG4gICAgICAgICAgICBtYXBDb250YWluZXIuY3NzKCdjdXJzb3InLCAnJyk7XG4gICAgICAgICAgICBzZWxlY3Rvci5yZW1vdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9yZW1vdmVNYXBNb3VzZUhhbmRsZXJzKCl7XG4gICAgICAgICAgbGV0IG1hcENvbnRhaW5lciA9IGFuZ3VsYXIuZWxlbWVudCh0aGlzLl9tYXAuY2FudmFzLnBhcmVudE5vZGUpO1xuICAgICAgICAgIG1hcENvbnRhaW5lci51bmJpbmQoJ21vdXNlZG93bicpO1xuICAgICAgICAgIG1hcENvbnRhaW5lci51bmJpbmQoJ21vdXNlbW92ZScpO1xuICAgICAgICAgIG1hcENvbnRhaW5lci51bmJpbmQoJ21vdXNldXAnKTtcbiAgICAgICAgICBtYXBDb250YWluZXIudW5iaW5kKCdtb3VzZWxlYXZlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBfaW5pdENlc2l1bU1vdXNlSGFuZGxlcnMoKXtcbiAgICAgICAgICBsZXQgc3RhcnRQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgbGV0IGVuZFBvc2l0aW9uID0gbnVsbDtcbiAgICAgICAgICBsZXQgY2FtZXJhID0gdGhpcy5fbWFwLnNjZW5lLmNhbWVyYTtcbiAgICAgICAgICBsZXQgZWxsaXBzb2lkID0gdGhpcy5fbWFwLnNjZW5lLmdsb2JlLmVsbGlwc29pZDtcbiAgICAgICAgICBsZXQgaGFuZGxlciA9IG5ldyBDZXNpdW0uU2NyZWVuU3BhY2VFdmVudEhhbmRsZXIodGhpcy5fbWFwLmNhbnZhcyk7XG5cbiAgICAgICAgICBoYW5kbGVyLnNldElucHV0QWN0aW9uKG1vdmVtZW50ID0+IHtcbiAgICAgICAgICAgIGxldCBjYXJ0ZXNpYW4gPSBjYW1lcmEucGlja0VsbGlwc29pZChtb3ZlbWVudC5wb3NpdGlvbik7XG5cbiAgICAgICAgICAgIGlmKGNhcnRlc2lhbil7XG4gICAgICAgICAgICAgIGxldCBjYXJ0b2dyYXBoaWMgPSBlbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWMoY2FydGVzaWFuKTtcbiAgICAgICAgICAgICAgc3RhcnRQb3NpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBsb246IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubG9uZ2l0dWRlKSxcbiAgICAgICAgICAgICAgICBsYXQ6IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubGF0aXR1ZGUpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgc3RhcnRQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgQ2VzaXVtLlNjcmVlblNwYWNlRXZlbnRUeXBlLkxFRlRfRE9XTik7XG5cbiAgICAgICAgICBoYW5kbGVyLnNldElucHV0QWN0aW9uKG1vdmVtZW50ID0+ICB7XG4gICAgICAgICAgICBsZXQgY2FydGVzaWFuID0gY2FtZXJhLnBpY2tFbGxpcHNvaWQobW92ZW1lbnQucG9zaXRpb24pO1xuXG4gICAgICAgICAgICBpZihjYXJ0ZXNpYW4pe1xuICAgICAgICAgICAgICBsZXQgY2FydG9ncmFwaGljID0gZWxsaXBzb2lkLmNhcnRlc2lhblRvQ2FydG9ncmFwaGljKGNhcnRlc2lhbik7XG4gICAgICAgICAgICAgIGVuZFBvc2l0aW9uID0ge1xuICAgICAgICAgICAgICAgIGxvbjogQ2VzaXVtLk1hdGgudG9EZWdyZWVzKGNhcnRvZ3JhcGhpYy5sb25naXR1ZGUpLFxuICAgICAgICAgICAgICAgIGxhdDogQ2VzaXVtLk1hdGgudG9EZWdyZWVzKGNhcnRvZ3JhcGhpYy5sYXRpdHVkZSlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBlbmRQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHRoaXMuX2Vuc2h1cmVGbHkgJiYgc3RhcnRQb3NpdGlvbiAhPT0gbnVsbCAmJiBlbmRQb3NpdGlvbiAhPSBudWxsKXtcbiAgICAgICAgICAgICAgdGhpcy5fZW5zaHVyZUZseSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgIGxldCByZWN0YW5nbGUgPSBDZXNpdW0uUmVjdGFuZ2xlLmZyb21EZWdyZWVzKFxuICAgICAgICAgICAgICAgIHN0YXJ0UG9zaXRpb24ubG9uLCBzdGFydFBvc2l0aW9uLmxhdCwgZW5kUG9zaXRpb24ubG9uLCBlbmRQb3NpdGlvbi5sYXRcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBjYW1lcmEuZmx5VG9SZWN0YW5nbGUoe1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiByZWN0YW5nbGVcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgQ2VzaXVtLlNjcmVlblNwYWNlRXZlbnRUeXBlLkxFRlRfVVApO1xuICAgICAgICB9XG5cbiAgICAgICAgX3JlbW92ZUNlc2l1bU1vdXNlSGFuZGxlcnMoKXtcbiAgICAgICAgICBsZXQgaGFuZGxlciA9IG5ldyBDZXNpdW0uU2NyZWVuU3BhY2VFdmVudEhhbmRsZXIodGhpcy5fbWFwLmNhbnZhcyk7XG4gICAgICAgICAgaGFuZGxlci5yZW1vdmVJbnB1dEFjdGlvbihDZXNpdW0uU2NyZWVuU3BhY2VFdmVudFR5cGUuTEVGVF9ET1dOKTtcbiAgICAgICAgICBoYW5kbGVyLnJlbW92ZUlucHV0QWN0aW9uKENlc2l1bS5TY3JlZW5TcGFjZUV2ZW50VHlwZS5MRUZUX1VQKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXJ0KCl7XG4gICAgICAgICAgdGhpcy5fbWFwLnNjZW5lLnNjcmVlblNwYWNlQ2FtZXJhQ29udHJvbGxlci5lbmFibGVSb3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLl9lbnNodXJlRmx5ID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5faW5pdENlc2l1bU1vdXNlSGFuZGxlcnMoKTtcbiAgICAgICAgICB0aGlzLl9pbml0TWFwTW91c2VIYW5kbGVycygpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RvcCgpe1xuICAgICAgICAgIHRoaXMuX21hcC5zY2VuZS5zY3JlZW5TcGFjZUNhbWVyYUNvbnRyb2xsZXIuZW5hYmxlUm90YXRlID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVDZXNpdW1Nb3VzZUhhbmRsZXJzKCk7XG4gICAgICAgICAgdGhpcy5fcmVtb3ZlTWFwTW91c2VIYW5kbGVycygpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBab29tQXJlYVRvb2w7XG4gICAgfVxuICBdKTtcblxufSh3aW5kb3cuYW5ndWxhcikpO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMi8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdab29tVG9vbCcsIFsnVG9vbCcsXHJcbiAgICBmdW5jdGlvbihUb29sKXtcclxuXHJcbiAgICAgIGNsYXNzIFpvb21Ub29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICAgICAgY29uc3RydWN0b3IobWFwKXtcclxuICAgICAgICAgIHRoaXMuX2NhbWVyYSA9IG1hcC5zY2VuZS5jYW1lcmE7XHJcbiAgICAgICAgICB0aGlzLl9lbGxpcHNvaWQgPSBtYXAuc2NlbmUuZ2xvYmUuZWxsaXBzb2lkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhcnQoKXsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgc3RvcCgpeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICB6b29tSW4oanVtcHMpe1xyXG4gICAgICAgICAganVtcHMgPSBOdW1iZXIuaXNGaW5pdGUoanVtcHMpID8ganVtcHMgOiAxO1xyXG4gICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGp1bXBzOyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgY2FtZXJhSGVpZ2h0ID0gdGhpcy5fZWxsaXBzb2lkLmNhcnRlc2lhblRvQ2FydG9ncmFwaGljKHRoaXMuX2NhbWVyYS5wb3NpdGlvbikuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgbW92ZVJhdGUgPSBjYW1lcmFIZWlnaHQgLyAxMDAuMDtcclxuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLm1vdmVGb3J3YXJkKG1vdmVSYXRlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHpvb21PdXQoanVtcHMpe1xyXG4gICAgICAgICAganVtcHMgPSBOdW1iZXIuaXNGaW5pdGUoanVtcHMpID8ganVtcHMgOiAxO1xyXG4gICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGp1bXBzOyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgY2FtZXJhSGVpZ2h0ID0gdGhpcy5fZWxsaXBzb2lkLmNhcnRlc2lhblRvQ2FydG9ncmFwaGljKHRoaXMuX2NhbWVyYS5wb3NpdGlvbikuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgbW92ZVJhdGUgPSBjYW1lcmFIZWlnaHQgLyAxMDAuMDtcclxuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLm1vdmVCYWNrd2FyZChtb3ZlUmF0ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gWm9vbVRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDIvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd6b29tV2lkZ2V0JywgWyckZG9jdW1lbnQnLFxyXG4gICAgZnVuY3Rpb24oJGRvY3VtZW50KXtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgIHJlcXVpcmU6ICdedG9vbCcsXHJcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwiem9vbS13aWRnZXRcIj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInpvb20taW4tYnRuXCI+JyArXHJcbiAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgbmctY2xpY2s9XCJ6b29tSW4oKTtcIj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXpvb20taW5cIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXHJcbiAgICAgICAgJzwvYnV0dG9uPicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInNsaWRlclwiPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImJhclwiPicgK1xyXG4gICAgICAgICc8L3NwYW4+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwicG9pbnRlclwiPicgK1xyXG4gICAgICAgICc8L3NwYW4+JyArXHJcbiAgICAgICAgJzwvZGl2PicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiem9vbS1vdXQtYnRuXCI+JyArXHJcbiAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgbmctY2xpY2s9XCJ6b29tT3V0KCk7XCI+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi16b29tLW91dFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcclxuICAgICAgICAnPC9idXR0b24+JyArXHJcbiAgICAgICAgJzwvZGl2PicgK1xyXG4gICAgICAgICc8L2Rpdj4nLFxyXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgdG9vbEN0cmwpe1xyXG4gICAgICAgICAgaWYoaXNGaW5pdGUoYXR0cnMud2lkdGgpIHx8IGlzRmluaXRlKGF0dHJzLmhlaWdodCkpe1xyXG4gICAgICAgICAgICBsZXQgd2lkdGggPSAgaXNGaW5pdGUoYXR0cnMud2lkdGgpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLndpZHRoKSArICdweCcgOiAnaW5oZXJpdCc7XHJcbiAgICAgICAgICAgIGxldCBoZWlnaHQgPSAgaXNGaW5pdGUoYXR0cnMuaGVpZ2h0KSA/IE51bWJlci5wYXJzZUludChhdHRycy5oZWlnaHQpICsgJ3B4JyA6ICdpbmhlcml0JztcclxuICAgICAgICAgICAgZWxlbWVudC5jc3Moe3Bvc2l0aW9uOiAncmVsYXRpdmUnLCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGV0IG1pbkxldmVsID0gaXNGaW5pdGUoYXR0cnMubWluKSA/IE51bWJlci5wYXJzZUludChhdHRycy5taW4pIDogMDtcclxuICAgICAgICAgIGxldCBtYXhMZXZlbCA9IGlzRmluaXRlKGF0dHJzLm1heCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMubWF4KSA6IDEwMDtcclxuXHJcbiAgICAgICAgICBpZihtaW5MZXZlbCA8IDAgfHwgbWF4TGV2ZWwgPCAwIHx8IG1pbkxldmVsID49IG1heExldmVsKXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibWluIG9yIG1heCBhdHRyaWJ1dGVzIHZhbHVlIGFyZSBpbnZhbGlkLlwiKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQganVtcHMgPSBpc0Zpbml0ZShhdHRycy5qdW1wKSA/IE51bWJlci5wYXJzZUludChhdHRycy5qdW1wKSA6IDEwO1xyXG5cclxuICAgICAgICAgIGxldCB6b29tVG9vbCA9IHRvb2xDdHJsLmdldFRvb2woKTtcclxuXHJcbiAgICAgICAgICBpZigodHlwZW9mIHpvb21Ub29sLnpvb21JbiAhPT0gJ2Z1bmN0aW9uJykgfHwgKHR5cGVvZiB6b29tVG9vbC56b29tT3V0ICE9PSAnZnVuY3Rpb24nKSl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJab29tIHdpZGdldCBtdXN0IGJlIGluc2lkZSB0b29sIHdpdGggWm9vbVRvb2wgdHlwZS5cIik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGV0IGxldmVsVmFsdWUgPSA5MCAvIChtYXhMZXZlbCAtIG1pbkxldmVsKTtcclxuICAgICAgICAgIGxldCBjdXJyZW50TGV2ZWwgPSAobWF4TGV2ZWwgLSBtaW5MZXZlbCkgLyAyO1xyXG4gICAgICAgICAgbGV0IHpvb21MZXZlbCA9IChtYXhMZXZlbCArIG1pbkxldmVsKSAvIDI7XHJcbiAgICAgICAgICBsZXQgdGVtcExldmVsID0gem9vbUxldmVsO1xyXG4gICAgICAgICAgbGV0IGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gNDU7XHJcblxyXG4gICAgICAgICAgbGV0IHBvaW50ZXIgID0gYW5ndWxhci5lbGVtZW50KGVsZW1lbnQuZmluZCgnc3BhbicpWzJdKTtcclxuICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlICsgJyUnKTtcclxuXHJcbiAgICAgICAgICBsZXQgY2xpZW50WSA9IG51bGw7XHJcbiAgICAgICAgICBsZXQgYmFySGVpZ2h0ID0gcG9pbnRlclswXS5jbGllbnRIZWlnaHQgKiAxMDtcclxuICAgICAgICAgIGxldCBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcclxuXHJcbiAgICAgICAgICBwb2ludGVyLm9uKCdtb3VzZWRvd24nLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgICAgICBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcclxuICAgICAgICAgICAgdGVtcExldmVsID0gem9vbUxldmVsO1xyXG4gICAgICAgICAgICBwb2ludGVyLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2V1cCcsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgaWYoY2xpZW50WSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgY2xpZW50WSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZihjbGllbnRZICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICBsZXQgZGVsdGFZID0gY2xpZW50WSAtIGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgICAgICAgbGV0IHBlcmNlbnQgPSAoTWF0aC5hYnMoZGVsdGFZKSAqIDEwMCAvIGJhckhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgIGlmKGRlbHRhWSA+IDApe1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudCA+PSAwKXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBzdGFydFBvaW50ZXJIZWlnaHQgLSBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGlmKHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQgPD0gOTApe1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSA5MDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbCA9IE1hdGgudHJ1bmMoY3VycmVudFBvaW50ZXJIZWlnaHQgLyBsZXZlbFZhbHVlKTtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwgPSBtYXhMZXZlbCAtIGN1cnJlbnRMZXZlbDtcclxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPiB0ZW1wTGV2ZWwpe1xyXG4gICAgICAgICAgICAgICAgem9vbVRvb2wuem9vbUluKCh6b29tTGV2ZWwgLSB0ZW1wTGV2ZWwpICoganVtcHMpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPCB0ZW1wTGV2ZWwpe1xyXG4gICAgICAgICAgICAgICAgem9vbVRvb2wuem9vbU91dCgodGVtcExldmVsIC0gem9vbUxldmVsKSAqIGp1bXBzKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGVtcExldmVsID0gem9vbUxldmVsO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlICsgJyUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgc2NvcGUuem9vbUluID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoem9vbUxldmVsIDwgbWF4TGV2ZWwpe1xyXG4gICAgICAgICAgICAgIHpvb21MZXZlbCsrO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbC0tO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcclxuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudFBvaW50ZXJIZWlnaHQgKyAnJScpO1xyXG4gICAgICAgICAgICAgIHpvb21Ub29sLnpvb21JbihqdW1wcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuem9vbU91dCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHpvb21MZXZlbCA+IG1pbkxldmVsKXtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwtLTtcclxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwrKztcclxuICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWU7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRQb2ludGVySGVpZ2h0ICsgJyUnKTtcclxuICAgICAgICAgICAgICB6b29tVG9vbC56b29tT3V0KGp1bXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==