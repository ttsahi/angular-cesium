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
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('Proxy', [function() {
    function Proxy(target, handler) {
      if (typeof target !== 'object' && typeof target !== 'function') {
        throw new TypeError("Target must be object or function.");
      }
      if (handler === undefined) {
        return;
      }
      if (typeof handler !== 'object') {
        throw new TypeError("Handler mut be object");
      }
      if (typeof target === 'function') {
        if (typeof handler.apply !== 'function') {
          return;
        }
        return function() {
          for (var args = [],
              $__0 = 0; $__0 < arguments.length; $__0++)
            args[$__0] = arguments[$__0];
          return handler.apply(target, this, args);
        };
      } else {
        if (typeof handler.get !== 'function' && typeof handler.set !== 'function') {
          return;
        }
        var $__1 = this,
            $__2 = function(prop) {
              var proxy = {};
              if (handler.get !== undefined) {
                proxy.get = (function() {
                  return handler.get(target, prop);
                });
              }
              if (handler.set !== undefined) {
                proxy.set = (function(val) {
                  handler.set(target, prop, val);
                });
              }
              Object.defineProperty($__1, prop, proxy);
            };
        for (var prop in target) {
          $__2(prop);
        }
      }
    }
    return Proxy;
  }]);
}(window.angular));
//# sourceURL=services/proxy.js
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
  angular.module('angularCesium').directive('tool', ['Tool', 'Proxy', function(Tool, Proxy) {
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
        tool.start = Proxy(tool.start, {apply: (function(target, context) {
            return toolBarCtrl.startTool({
              start: (function() {
                return target.apply(tool);
              }),
              stop: (function() {
                return tool.stop();
              })
            });
          })});
        scope.tool = tool;
        linker(scope, (function(clone) {
          element.parent().append(clone);
        }));
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tool/tool.drv.js
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Byb3h5LmpzIiwic2VydmljZXMvdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL2JpbGxib2FyZC9iaWxsYm9hcmQuanMiLCJtYXAtY29tcG9uZW50cy9sYWJlbC9sYWJlbC5qcyIsIm1hcC1jb21wb25lbnRzL2xhYmVscy1sYXllci9sYWJlbHMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9wb2x5bGluZS9wb2x5bGluZS5qcyIsIm1hcC1jb21wb25lbnRzL2NvbXBsZXgtbGF5ZXIvY29tcGxleC1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL2JpbGxib2FyZHMtbGF5ZXIvYmlsbGJvYXJkcy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL21hcC9tYXAtZGlyZWN0aXZlLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmVzLWxheWVyL3BvbHlsaW5lcy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC1iYXIuZHJ2LmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbC90b29sLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3dlYi1tYXAtc2VydmljZS1sYXllci93ZWItbWFwLXNlcnZpY2UtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29sYmFyL2RyYWdnYWJsZS5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xiYXIvdG9vbGJhci5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20tYXJlYS96b29tLWFyZWEtdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS10b29sLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbHMvem9vbS96b29tLXdpZGdldC5kcnYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFuZ3VsYXItY2VzaXVtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJywgWydvYnNlcnZhYmxlQ29sbGVjdGlvbiddKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5zZXJ2aWNlKCdCaWxsQm9hcmRBdHRyaWJ1dGVzJywgZnVuY3Rpb24oJHBhcnNlKSB7XHJcbiAgdGhpcy5jYWxjQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGF0dHJzLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBpbWFnZSA6ICRwYXJzZShhdHRycy5pbWFnZSkoY29udGV4dClcclxuICAgIH07XHJcbiAgICB2YXIgcG9zaXRpb25BdHRyID0gJHBhcnNlKGF0dHJzLnBvc2l0aW9uKShjb250ZXh0KTtcclxuICAgIHJlc3VsdC5wb3NpdGlvbiA9IENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbkF0dHIubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb25BdHRyLmFsdGl0dWRlKSB8fCAwKTtcclxuXHJcbiAgICB2YXIgY29sb3IgPSAkcGFyc2UoYXR0cnMuY29sb3IpKGNvbnRleHQpO1xyXG4gICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgIHJlc3VsdC5jb2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoY29sb3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnQ2VzaXVtJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIENlc2l1bTtcclxufSk7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDA5LzAyLzE1LlxuICovXG5cbihmdW5jdGlvbihhbmd1bGFyKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdQcm94eScsIFtcbiAgICBmdW5jdGlvbigpe1xuXG4gICAgICBmdW5jdGlvbiBQcm94eSh0YXJnZXQsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRhcmdldCBtdXN0IGJlIG9iamVjdCBvciBmdW5jdGlvbi5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZihoYW5kbGVyID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYodHlwZW9mIGhhbmRsZXIgIT09ICdvYmplY3QnKXtcbiAgICAgICAgICB0aHJvdyAgbmV3IFR5cGVFcnJvcihcIkhhbmRsZXIgbXV0IGJlIG9iamVjdFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbicpe1xuXG4gICAgICAgICAgaWYodHlwZW9mIGhhbmRsZXIuYXBwbHkgIT09ICdmdW5jdGlvbicpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKXsgcmV0dXJuIGhhbmRsZXIuYXBwbHkodGFyZ2V0LCB0aGlzLCBhcmdzKSB9O1xuXG4gICAgICAgIH1lbHNle1xuXG4gICAgICAgICAgaWYodHlwZW9mIGhhbmRsZXIuZ2V0ICE9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBoYW5kbGVyLnNldCAhPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yKGxldCBwcm9wIGluIHRhcmdldCl7XG5cbiAgICAgICAgICAgIGxldCBwcm94eSA9IHt9O1xuXG4gICAgICAgICAgICBpZihoYW5kbGVyLmdldCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgcHJveHkuZ2V0ID0gKCkgPT4gaGFuZGxlci5nZXQodGFyZ2V0LCBwcm9wKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoaGFuZGxlci5zZXQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgIHByb3h5LnNldCA9IHZhbCA9PiB7IGhhbmRsZXIuc2V0KHRhcmdldCwgcHJvcCwgdmFsKTsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgcHJvcCwgcHJveHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJveHk7XG4gICAgfVxuICBdKTtcblxufSh3aW5kb3cuYW5ndWxhcikpO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdUb29sJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgIGNsYXNzIFRvb2wge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKG1hcCl7IHRoaXMuX21hcCA9IG1hcDsgfVxyXG4gICAgICAgIHN0YXJ0KCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxyXG4gICAgICAgIHN0b3AoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiOyB9XHJcbiAgICAgICAgY2FuY2VsKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjt9XHJcbiAgICAgICAgb25VcGRhdGUoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkJywgZnVuY3Rpb24oQmlsbEJvYXJkQXR0cmlidXRlcykge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmJpbGxib2FyZHNMYXllcicsXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBiaWxsYm9hcmRzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBiaWxsRGVzYyA9IEJpbGxCb2FyZEF0dHJpYnV0ZXMuY2FsY0F0dHJpYnV0ZXMoYXR0cnMsIHNjb3BlKTtcclxuXHJcbiAgICAgIHZhciBiaWxsYm9hcmQgPSBiaWxsYm9hcmRzTGF5ZXJDdHJsLmdldEJpbGxib2FyZENvbGxlY3Rpb24oKS5hZGQoYmlsbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLnJlbW92ZShiaWxsYm9hcmQpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebGFiZWxzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB0ZXh0IDogJyYnLFxyXG4gICAgICBwb3NpdGlvbiA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGxhYmVsc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgbGFiZWxEZXNjID0ge307XHJcblxyXG4gICAgICB2YXIgcG9zaXRpb24gPSBzY29wZS5wb3NpdGlvbigpO1xyXG4gICAgICBsYWJlbERlc2MucG9zaXRpb24gPSBDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCk7XHJcblxyXG4gICAgICB2YXIgY29sb3IgPSBzY29wZS5jb2xvcigpO1xyXG4gICAgICBpZiAoY29sb3IpIHtcclxuICAgICAgICBsYWJlbERlc2MuY29sb3IgPSBjb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGFiZWxEZXNjLnRleHQgPSBzY29wZS50ZXh0KCk7XHJcblxyXG4gICAgICB2YXIgbGFiZWwgPSBsYWJlbHNMYXllckN0cmwuZ2V0TGFiZWxDb2xsZWN0aW9uKCkuYWRkKGxhYmVsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLnJlbW92ZShsYWJlbCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbGFiZWxzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRMYWJlbENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5MYWJlbENvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmUnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15wb2x5bGluZXNMYXllcicsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgY29sb3IgOiAnJicsXHJcbiAgICAgIHdpZHRoIDogJyYnLFxyXG4gICAgICBwb3NpdGlvbnMgOiAnJidcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBwb2x5bGluZXNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIHBvbHlsaW5lRGVzYyA9IHt9O1xyXG5cclxuICAgICAgaWYgKCFhbmd1bGFyLmlzRGVmaW5lZChzY29wZS5wb3NpdGlvbnMpIHx8ICFhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUucG9zaXRpb25zKSl7XHJcbiAgICAgICAgdGhyb3cgXCJQb2x5bGluZSBwb3NpdGlvbnMgbXVzdCBiZSBkZWZpbmVkIGFzIGEgZnVuY3Rpb25cIjtcclxuICAgICAgfVxyXG4gICAgICB2YXIgcG9zaXRpb25zID0gc2NvcGUucG9zaXRpb25zKCk7XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5wb3NpdGlvbnMgPSBbXTtcclxuICAgICAgYW5ndWxhci5mb3JFYWNoKHBvc2l0aW9ucywgZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgICAgICBwb2x5bGluZURlc2MucG9zaXRpb25zLnB1c2goQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24ubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24uYWx0aXR1ZGUpIHx8IDApKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY2VzaXVtQ29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKCdibGFjaycpO1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2NvcGUuY29sb3IpICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS5jb2xvcikpe1xyXG4gICAgICAgIGNlc2l1bUNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZyhzY29wZS5jb2xvcigpKTtcclxuICAgICAgICB9XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5tYXRlcmlhbCA9IENlc2l1bS5NYXRlcmlhbC5mcm9tVHlwZSgnQ29sb3InKTtcclxuICAgICAgcG9seWxpbmVEZXNjLm1hdGVyaWFsLnVuaWZvcm1zLmNvbG9yID0gY2VzaXVtQ29sb3I7XHJcblxyXG4gICAgICBwb2x5bGluZURlc2Mud2lkdGggPSAxO1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2NvcGUud2lkdGgpICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS53aWR0aCkpe1xyXG4gICAgICAgIHBvbHlsaW5lRGVzYy53aWR0aCA9IHNjb3BlLndpZHRoKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBwb2x5bGluZSA9IHBvbHlsaW5lc0xheWVyQ3RybC5nZXRQb2x5bGluZUNvbGxlY3Rpb24oKS5hZGQocG9seWxpbmVEZXNjKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBwb2x5bGluZXNMYXllckN0cmwuZ2V0UG9seWxpbmVDb2xsZWN0aW9uKCkucmVtb3ZlKHBvbHlsaW5lKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxNy8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdjb21wbGV4TGF5ZXInLCBmdW5jdGlvbigkbG9nKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbXBpbGUgOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xyXG4gICAgICBpZiAoYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudC5jaGlsZHJlbigpLCBmdW5jdGlvbiAoY2hpbGQpIHtcclxuXHJcbiAgICAgICAgICB2YXIgbGF5ZXIgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgaWYgKGNoaWxkLnRhZ05hbWUgPT09ICdCSUxMQk9BUkQnKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gYW5ndWxhci5lbGVtZW50KCc8YmlsbGJvYXJkcy1sYXllcj48L2JpbGxib2FyZHMtbGF5ZXI+Jyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmIChjaGlsZC50YWdOYW1lID09PSAnTEFCRUwnKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gYW5ndWxhci5lbGVtZW50KCc8bGFiZWxzLWxheWVyPjwvbGFiZWxzLWxheWVyPicpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICghbGF5ZXIpIHtcclxuICAgICAgICAgICAgJGxvZy53YXJuKCdGb3VuZCBhbiB1bmtub3duIGNoaWxkIG9mIG9mIGNvbXBsZXgtbGF5ZXIuIFJlbW92aW5nLi4uJyk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChjaGlsZCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNoaWxkLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdHRyKSB7XHJcbiAgICAgICAgICAgICAgbGF5ZXIuYXR0cihhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnRbMF0uYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcclxuICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZWxlbWVudChjaGlsZCkuYXR0cihhdHRyLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBsYXllci5hdHRyKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGNoaWxkKS5yZXBsYWNlV2l0aChsYXllcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkc0xheWVyJywgZnVuY3Rpb24oJHBhcnNlLCBPYnNlcnZhYmxlQ29sbGVjdGlvbiwgQmlsbEJvYXJkQXR0cmlidXRlcywgQ2VzaXVtKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUsICRhdHRycykge1xyXG4gICAgICB0aGlzLmdldEJpbGxib2FyZENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoJGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBnZXQgY29sbGVjdGlvbiBpZiBsYXllciBpcyBib3VuZCB0byBPYnNlcnZhYmxlQ29sbGVjdGlvbicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uQmlsbGJvYXJkQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgdmFyIENPTExFQ1RJT05fUkVHRVhQID0gL1xccyooW1xcJFxcd11bXFwkXFx3XSopXFxzK2luXFxzKyhbXFwkXFx3XVtcXCRcXHddKikvO1xyXG4gICAgICAgICAgdmFyIG1hdGNoID0gYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24ubWF0Y2goQ09MTEVDVElPTl9SRUdFWFApO1xyXG4gICAgICAgICAgdmFyIGl0ZW1OYW1lID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICB2YXIgY29sbGVjdGlvbiA9ICRwYXJzZShtYXRjaFsyXSkoc2NvcGUpO1xyXG4gICAgICAgICAgaWYgKCFjb2xsZWN0aW9uIGluc3RhbmNlb2YgT2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvYnNlcnZhYmxlLWNvbGxlY3Rpb24gbXVzdCBiZSBvZiB0eXBlIE9ic2VydmFibGVDb2xsZWN0aW9uLicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhZGRCaWxsYm9hcmQgPSBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICAgICAgICBjb250ZXh0W2l0ZW1OYW1lXSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24uYWRkKGJpbGxEZXNjKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb2xsZWN0aW9uLmdldERhdGEoKSwgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgIGFkZEJpbGxib2FyZChpdGVtKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vbkFkZChhZGRCaWxsYm9hcmQpO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uVXBkYXRlKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vblJlbW92ZShmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24ucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24uZ2V0KGluZGV4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ21hcCcsIGZ1bmN0aW9uKCkge1xyXG4gIGZ1bmN0aW9uIGdldFNjZW5lTW9kZShkaW1lbnNpb25zKSB7XHJcbiAgICBpZiAoZGltZW5zaW9ucyA9PSAyKSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FMkQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChkaW1lbnNpb25zID09IDIuNSkge1xyXG4gICAgICByZXR1cm4gQ2VzaXVtLlNjZW5lTW9kZS5DT0xVTUJVU19WSUVXO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FM0Q7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdj4gPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPiA8ZGl2IGNsYXNzPVwibWFwLWNvbnRhaW5lclwiPjwvZGl2PiA8L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgZGltZW5zaW9ucyA6ICdAJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNlc2l1bTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLm9uRHJvcCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAoIXNjb3BlLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICAgIHNjb3BlLmRpbWVuc2lvbnMgPSAzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NvcGUuY2VzaXVtID0gbmV3IENlc2l1bS5DZXNpdW1XaWRnZXQoZWxlbWVudC5maW5kKCdkaXYnKVswXSwge1xyXG4gICAgICAgICAgc2NlbmVNb2RlOiBnZXRTY2VuZU1vZGUoc2NvcGUuZGltZW5zaW9ucylcclxuICAgICAgICB9KTtcclxuICAgICAgICBzY29wZS5tYXBSZWN0ID0gZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBnaWxuaXMyIG9uIDE4LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3BvbHlsaW5lc0xheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge30sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuZ2V0UG9seWxpbmVDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uUG9seWxpbmVDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAxLzAyLzE1LlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgndG9vbEJhcicsIFtcclxuICAgIGZ1bmN0aW9uKCl7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVxdWlyZTogJ15tYXAnLFxyXG4gICAgICAgIC8vdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAvL3RlbXBsYXRlOiAnPGRpdiBuZy10cmFuc2NsdWRlPVwiXCI+PC9kaXY+JyxcclxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsXHJcbiAgICAgICAgICBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRUb29sID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0Q2VzaXVtV2lkZ2V0ID0gKCkgPT4gJHNjb3BlLmdldENlc2l1bVdpZGdldCgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdGFydFRvb2wgPSBmdW5jdGlvbih0b29sKXtcclxuICAgICAgICAgICAgICBpZihjdXJyZW50VG9vbCAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VG9vbC5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjdXJyZW50VG9vbCA9IHRvb2w7XHJcbiAgICAgICAgICAgICAgY3VycmVudFRvb2wuc3RhcnQoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGxpbms6IHtcclxuICAgICAgICAgIHByZTogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKXtcclxuICAgICAgICAgICAgc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0ID0gbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cbiAqL1xuXG4oZnVuY3Rpb24oYW5ndWxhcil7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sJywgWydUb29sJywgJ1Byb3h5JyxcbiAgICBmdW5jdGlvbihUb29sLCBQcm94eSl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlOiAnXnRvb2xiYXInLFxuICAgICAgICB0cmFuc2NsdWRlOiAnZWxlbWVudCcsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgdHlwZTogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJyxcbiAgICAgICAgICBmdW5jdGlvbigkc2NvcGUpe1xuICAgICAgICAgICAgdGhpcy5nZXRUb29sID0gKCkgPT4gJHNjb3BlLnRvb2w7XG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xCYXJDdHJsLCBsaW5rZXIpe1xuICAgICAgICAgIGlmKCEodHlwZW9mIHNjb3BlLnR5cGUgPT09ICdmdW5jdGlvbicpKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0eXBlIGF0dHIgbXVzdCBiZSBjb25zdHJ1Y3Rvci5cIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRvb2wgPSBuZXcgc2NvcGUudHlwZSh0b29sQmFyQ3RybC5nZXRDZXNpdW1XaWRnZXQoKSk7XG5cbiAgICAgICAgICBpZighKHRvb2wgaW5zdGFuY2VvZiBUb29sKSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidG9vbCBtdXN0IGJlIGluc3RhbmNlIG9mIFRvb2wuXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRvb2wuc3RhcnQgPSBQcm94eSh0b29sLnN0YXJ0LCB7XG4gICAgICAgICAgICBhcHBseTogKHRhcmdldCwgY29udGV4dCkgPT4gdG9vbEJhckN0cmwuc3RhcnRUb29sKHtcbiAgICAgICAgICAgICAgc3RhcnQ6ICgpID0+IHRhcmdldC5hcHBseSh0b29sKSxcbiAgICAgICAgICAgICAgc3RvcDogKCkgPT4gdG9vbC5zdG9wKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBzY29wZS50b29sID0gdG9vbDtcblxuICAgICAgICAgIGxpbmtlcihzY29wZSwgKGNsb25lKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50LnBhcmVudCgpLmFwcGVuZChjbG9uZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxufSh3aW5kb3cuYW5ndWxhcikpO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd3ZWJNYXBTZXJ2aWNlTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIHVybCA6ICcmJyxcclxuICAgICAgbGF5ZXJzIDogJyYnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgdmFyIHByb3ZpZGVyID0gbmV3IENlc2l1bS5XZWJNYXBTZXJ2aWNlSW1hZ2VyeVByb3ZpZGVyKHtcclxuICAgICAgICB1cmw6IHNjb3BlLnVybCgpLFxyXG4gICAgICAgIGxheWVycyA6IHNjb3BlLmxheWVycygpXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGxheWVyID0gbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLmFkZEltYWdlcnlQcm92aWRlcihwcm92aWRlcik7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLnJlbW92ZShsYXllcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBlcmV6eSBvbiAyLzEvMjAxNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJylcclxuICAuZGlyZWN0aXZlKCdkcmFnZ2FibGUnLCBbJyRkb2N1bWVudCcsIGZ1bmN0aW9uKCRkb2N1bWVudCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XHJcbiAgICAgIHZhciBzdGFydFggPSAwLCBzdGFydFkgPSAwLCB4ID0gMCwgeSA9IDAsICB4MSA9IDAsIHkxID0gMCwgb2Zmc2V0VG9wID0gLTEsb2Zmc2V0TGVmdCA9IC0xO1xyXG4gICAgICB2YXIgbWFwUmVjdCA9IHNjb3BlLiRwYXJlbnQubWFwUmVjdCxuZXdNYXBSZWN0ID0ge30sIGVsZW1SZWN0ID0ge307XHJcbiAgICAgIHZhciB0b29sYmFyID0gZWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgZWxlbWVudC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAvLyBQcmV2ZW50IGRlZmF1bHQgZHJhZ2dpbmcgb2Ygc2VsZWN0ZWQgY29udGVudFxyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaWYob2Zmc2V0VG9wID09IC0xKXtcclxuICAgICAgICAgIG9mZnNldFRvcCA9IHRvb2xiYXJbMF0ub2Zmc2V0VG9wO1xyXG4gICAgICAgICAgb2Zmc2V0TGVmdCA9IHRvb2xiYXJbMF0ub2Zmc2V0TGVmdDtcclxuICAgICAgICAgIG5ld01hcFJlY3QudG9wID0gb2Zmc2V0VG9wICsgbWFwUmVjdC50b3A7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LmxlZnQgPSBvZmZzZXRMZWZ0ICsgbWFwUmVjdC5sZWZ0O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC5yaWdodCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LnJpZ2h0IC0gNTtcclxuICAgICAgICAgIG5ld01hcFJlY3QuYm90dG9tID0gb2Zmc2V0VG9wICsgbWFwUmVjdC5ib3R0b20gLSAxNTtcclxuICAgICAgICAgIGVsZW1SZWN0ID0gdG9vbGJhclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdkcmFnZ2FibGUyJyxuZXdNYXBSZWN0KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIG9mZnNldFRvcCA9IDA7XHJcbiAgICAgICAgICBvZmZzZXRMZWZ0ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhcnRYID0gZXZlbnQucGFnZVggLSB4IC0gb2Zmc2V0TGVmdDtcclxuICAgICAgICBzdGFydFkgPSBldmVudC5wYWdlWSAtIHkgLSBvZmZzZXRUb3A7XHJcbiAgICAgICAgZWxlbWVudC5jc3Moe1xyXG4gICAgICAgICAgY3Vyc29yOiAnLXdlYmtpdC1ncmFiYmluZydcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNlbW92ZScsIG1vdXNlbW92ZSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZXVwJywgbW91c2V1cCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgZnVuY3Rpb24gbW91c2Vtb3ZlKGV2ZW50KSB7XHJcbiAgICAgICAgeSA9IGV2ZW50LnBhZ2VZIC0gc3RhcnRZO1xyXG4gICAgICAgIHggPSBldmVudC5wYWdlWCAtIHN0YXJ0WDtcclxuXHJcbiAgICAgICAgaWYoIWluc2lkZU1hcCgpKSB7XHJcbiAgICAgICAgICB0b29sYmFyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogeTEgKyAncHgnLFxyXG4gICAgICAgICAgICBsZWZ0OiB4MSArICdweCdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgeDEgPSB4O1xyXG4gICAgICAgICAgeTEgPSB5O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gbW91c2V1cCgpIHtcclxuICAgICAgICBlbGVtZW50LmNzcyh7XHJcbiAgICAgICAgICBjdXJzb3I6ICctd2Via2l0LWdyYWInXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9mZignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcclxuICAgICAgICAkZG9jdW1lbnQub2ZmKCdtb3VzZXVwJywgbW91c2V1cCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGluc2lkZU1hcCgpe1xyXG4gICAgICAgIHRvb2xiYXIuY3NzKHtcclxuICAgICAgICAgIHRvcDogeSArICdweCcsXHJcbiAgICAgICAgICBsZWZ0OiB4ICsgJ3B4J1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGVsZW1SZWN0ID0gdG9vbGJhclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICBpZihlbGVtUmVjdC50b3AgPCBuZXdNYXBSZWN0LnRvcCB8fCBlbGVtUmVjdC5sZWZ0IDwgbmV3TWFwUmVjdC5sZWZ0IHx8IGVsZW1SZWN0LnJpZ2h0ID4gbmV3TWFwUmVjdC5yaWdodCB8fCBlbGVtUmVjdC5ib3R0b20gPiBuZXdNYXBSZWN0LmJvdHRvbSl7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1dKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZXJlenkgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgndG9vbGJhcicsIGZ1bmN0aW9uKCkge1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICB0ZW1wbGF0ZSA6ICc8ZGl2IGNsYXNzPVwidG9vbGJhclwiID48ZGl2IGNsYXNzPVwiZHJhZy1idXR0b24gZ2x5cGhpY29uIGdseXBoaWNvbi1taW51c1wiIGRyYWdnYWJsZT48L2Rpdj4gPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPjwvZGl2PicsXHJcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIGxldCBjdXJyZW50VG9vbCA9IG51bGw7XHJcblxyXG4gICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9ICgpID0+ICRzY29wZS5nZXRDZXNpdW1XaWRnZXQoKTtcclxuXHJcbiAgICAgIHRoaXMuc3RhcnRUb29sID0gZnVuY3Rpb24odG9vbCl7XHJcbiAgICAgICAgaWYoY3VycmVudFRvb2wgIT09IG51bGwpe1xyXG4gICAgICAgICAgY3VycmVudFRvb2wuc3RvcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmVudFRvb2wgPSB0b29sO1xyXG4gICAgICAgIGN1cnJlbnRUb29sLnN0YXJ0KCk7XHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpe1xyXG4gICAgICAgIHNjb3BlLmdldENlc2l1bVdpZGdldCA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDUvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnWm9vbUFyZWFUb29sJywgWydUb29sJywgJ0Nlc2l1bScsXHJcbiAgICBmdW5jdGlvbihUb29sLCBDZXNpdW0pe1xyXG5cclxuICAgICAgY2xhc3MgWm9vbUFyZWFUb29sIGV4dGVuZHMgVG9vbCB7XHJcblxyXG4gICAgICAgIF9pbml0TWFwTW91c2VIYW5kbGVycygpe1xyXG4gICAgICAgICAgbGV0IHBhZ2VYID0gMDtcclxuICAgICAgICAgIGxldCBwYWdlWSA9IDA7XHJcbiAgICAgICAgICBsZXQgc3RhcnRYID0gMDtcclxuICAgICAgICAgIGxldCBzdGFydFkgPSAwO1xyXG4gICAgICAgICAgbGV0IGRlbHRhWCA9IDA7XHJcbiAgICAgICAgICBsZXQgZGVsdGFZID0gMDtcclxuICAgICAgICAgIGxldCBzZWxlY3RlZFN0YXJ0ID0gZmFsc2U7XHJcbiAgICAgICAgICBsZXQgc2VsZWN0b3IgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgICBsZXQgbWFwQ29udGFpbmVyID0gYW5ndWxhci5lbGVtZW50KHRoaXMuX21hcC5jYW52YXMucGFyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgc2VsZWN0b3IuY3NzKCdib3JkZXInLCAnMnB4IGRhc2hlZCB3aGl0ZScpO1xyXG5cclxuICAgICAgICAgIG1hcENvbnRhaW5lci5vbignbW91c2Vkb3duJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBwYWdlWCA9IGV2ZW50LnBhZ2VYO1xyXG4gICAgICAgICAgICBwYWdlWSA9IGV2ZW50LnBhZ2VZO1xyXG4gICAgICAgICAgICBzdGFydFggPSBldmVudC5vZmZzZXRYO1xyXG4gICAgICAgICAgICBzdGFydFkgPSBldmVudC5vZmZzZXRZO1xyXG4gICAgICAgICAgICB0aGlzLl9lbnNodXJlRmx5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIG1hcENvbnRhaW5lci5jc3MoJ2N1cnNvcicsICd6b29tLWluJyk7XHJcblxyXG4gICAgICAgICAgICBzZWxlY3Rvci5jc3Moe1xyXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgIHRvcDogYCR7c3RhcnRZfXB4YCxcclxuICAgICAgICAgICAgICBsZWZ0OiBgJHtzdGFydFh9cHhgLFxyXG4gICAgICAgICAgICAgIHdpZHRoOiAnMHB4JyxcclxuICAgICAgICAgICAgICBoZWlnaHQ6ICcwcHgnXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbWFwQ29udGFpbmVyLmFwcGVuZChzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSB0cnVlO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgbWFwQ29udGFpbmVyLm9uKCdtb3VzZW1vdmUnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKCFzZWxlY3RlZFN0YXJ0KXtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlbHRhWCA9ICBldmVudC5wYWdlWCAtIHBhZ2VYO1xyXG4gICAgICAgICAgICBkZWx0YVkgPSBldmVudC5wYWdlWSAtIHBhZ2VZO1xyXG5cclxuICAgICAgICAgICAgbGV0IHNlbGVjdG9yU3R5bGUgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmKGRlbHRhWCA+IDApe1xyXG4gICAgICAgICAgICAgIHNlbGVjdG9yU3R5bGUud2lkdGggPSBgJHtkZWx0YVh9cHhgO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKGRlbHRhWCA8IDApe1xyXG4gICAgICAgICAgICAgIGRlbHRhWCA9IE1hdGguYWJzKGRlbHRhWCk7XHJcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS53aWR0aCA9IGAke2RlbHRhWH1weGA7XHJcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS5sZWZ0ID0gYCR7c3RhcnRYIC0gZGVsdGFYfXB4YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihkZWx0YVkgPiAwKXtcclxuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLmhlaWdodCA9IGAke2RlbHRhWX1weGA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoZGVsdGFZIDwgMCl7XHJcbiAgICAgICAgICAgICAgZGVsdGFZID0gTWF0aC5hYnMoZGVsdGFZKTtcclxuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLmhlaWdodCA9IGAke2RlbHRhWX1weGA7XHJcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS50b3AgPSBgJHtzdGFydFkgLSBkZWx0YVl9cHhgO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxlY3Rvci5jc3Moc2VsZWN0b3JTdHlsZSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBtYXBDb250YWluZXIub24oJ21vdXNldXAnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2VsZWN0b3IucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIG1hcENvbnRhaW5lci5jc3MoJ2N1cnNvcicsICcnKTtcclxuICAgICAgICAgICAgdGhpcy5fZW5zaHVyZUZseSA9IHRydWU7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBtYXBDb250YWluZXIub24oJ21vdXNlbGVhdmUnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgbWFwQ29udGFpbmVyLmNzcygnY3Vyc29yJywgJycpO1xyXG4gICAgICAgICAgICBzZWxlY3Rvci5yZW1vdmUoKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgX3JlbW92ZU1hcE1vdXNlSGFuZGxlcnMoKXtcclxuICAgICAgICAgIGxldCBtYXBDb250YWluZXIgPSBhbmd1bGFyLmVsZW1lbnQodGhpcy5fbWFwLmNhbnZhcy5wYXJlbnROb2RlKTtcclxuICAgICAgICAgIG1hcENvbnRhaW5lci51bmJpbmQoJ21vdXNlZG93bicpO1xyXG4gICAgICAgICAgbWFwQ29udGFpbmVyLnVuYmluZCgnbW91c2Vtb3ZlJyk7XHJcbiAgICAgICAgICBtYXBDb250YWluZXIudW5iaW5kKCdtb3VzZXVwJyk7XHJcbiAgICAgICAgICBtYXBDb250YWluZXIudW5iaW5kKCdtb3VzZWxlYXZlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfaW5pdENlc2l1bU1vdXNlSGFuZGxlcnMoKXtcclxuICAgICAgICAgIGxldCBzdGFydFBvc2l0aW9uID0gbnVsbDtcclxuICAgICAgICAgIGxldCBlbmRQb3NpdGlvbiA9IG51bGw7XHJcbiAgICAgICAgICBsZXQgY2FtZXJhID0gdGhpcy5fbWFwLnNjZW5lLmNhbWVyYTtcclxuICAgICAgICAgIGxldCBlbGxpcHNvaWQgPSB0aGlzLl9tYXAuc2NlbmUuZ2xvYmUuZWxsaXBzb2lkO1xyXG4gICAgICAgICAgbGV0IGhhbmRsZXIgPSBuZXcgQ2VzaXVtLlNjcmVlblNwYWNlRXZlbnRIYW5kbGVyKHRoaXMuX21hcC5jYW52YXMpO1xyXG5cclxuICAgICAgICAgIGhhbmRsZXIuc2V0SW5wdXRBY3Rpb24obW92ZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY2FydGVzaWFuID0gY2FtZXJhLnBpY2tFbGxpcHNvaWQobW92ZW1lbnQucG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgaWYoY2FydGVzaWFuKXtcclxuICAgICAgICAgICAgICBsZXQgY2FydG9ncmFwaGljID0gZWxsaXBzb2lkLmNhcnRlc2lhblRvQ2FydG9ncmFwaGljKGNhcnRlc2lhbik7XHJcbiAgICAgICAgICAgICAgc3RhcnRQb3NpdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIGxvbjogQ2VzaXVtLk1hdGgudG9EZWdyZWVzKGNhcnRvZ3JhcGhpYy5sb25naXR1ZGUpLFxyXG4gICAgICAgICAgICAgICAgbGF0OiBDZXNpdW0uTWF0aC50b0RlZ3JlZXMoY2FydG9ncmFwaGljLmxhdGl0dWRlKVxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgIHN0YXJ0UG9zaXRpb24gPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBDZXNpdW0uU2NyZWVuU3BhY2VFdmVudFR5cGUuTEVGVF9ET1dOKTtcclxuXHJcbiAgICAgICAgICBoYW5kbGVyLnNldElucHV0QWN0aW9uKG1vdmVtZW50ID0+ICB7XHJcbiAgICAgICAgICAgIGxldCBjYXJ0ZXNpYW4gPSBjYW1lcmEucGlja0VsbGlwc29pZChtb3ZlbWVudC5wb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZihjYXJ0ZXNpYW4pe1xyXG4gICAgICAgICAgICAgIGxldCBjYXJ0b2dyYXBoaWMgPSBlbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWMoY2FydGVzaWFuKTtcclxuICAgICAgICAgICAgICBlbmRQb3NpdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIGxvbjogQ2VzaXVtLk1hdGgudG9EZWdyZWVzKGNhcnRvZ3JhcGhpYy5sb25naXR1ZGUpLFxyXG4gICAgICAgICAgICAgICAgbGF0OiBDZXNpdW0uTWF0aC50b0RlZ3JlZXMoY2FydG9ncmFwaGljLmxhdGl0dWRlKVxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgIGVuZFBvc2l0aW9uID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYodGhpcy5fZW5zaHVyZUZseSAmJiBzdGFydFBvc2l0aW9uICE9PSBudWxsICYmIGVuZFBvc2l0aW9uICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgIHRoaXMuX2Vuc2h1cmVGbHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgbGV0IHJlY3RhbmdsZSA9IENlc2l1bS5SZWN0YW5nbGUuZnJvbURlZ3JlZXMoXHJcbiAgICAgICAgICAgICAgICBzdGFydFBvc2l0aW9uLmxvbiwgc3RhcnRQb3NpdGlvbi5sYXQsIGVuZFBvc2l0aW9uLmxvbiwgZW5kUG9zaXRpb24ubGF0XHJcbiAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgY2FtZXJhLmZseVRvUmVjdGFuZ2xlKHtcclxuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiByZWN0YW5nbGVcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgQ2VzaXVtLlNjcmVlblNwYWNlRXZlbnRUeXBlLkxFRlRfVVApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgX3JlbW92ZUNlc2l1bU1vdXNlSGFuZGxlcnMoKXtcclxuICAgICAgICAgIGxldCBoYW5kbGVyID0gbmV3IENlc2l1bS5TY3JlZW5TcGFjZUV2ZW50SGFuZGxlcih0aGlzLl9tYXAuY2FudmFzKTtcclxuICAgICAgICAgIGhhbmRsZXIucmVtb3ZlSW5wdXRBY3Rpb24oQ2VzaXVtLlNjcmVlblNwYWNlRXZlbnRUeXBlLkxFRlRfRE9XTik7XHJcbiAgICAgICAgICBoYW5kbGVyLnJlbW92ZUlucHV0QWN0aW9uKENlc2l1bS5TY3JlZW5TcGFjZUV2ZW50VHlwZS5MRUZUX1VQKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXJ0KCl7XHJcbiAgICAgICAgICB0aGlzLl9tYXAuc2NlbmUuc2NyZWVuU3BhY2VDYW1lcmFDb250cm9sbGVyLmVuYWJsZVJvdGF0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgdGhpcy5fZW5zaHVyZUZseSA9IGZhbHNlO1xyXG4gICAgICAgICAgdGhpcy5faW5pdENlc2l1bU1vdXNlSGFuZGxlcnMoKTtcclxuICAgICAgICAgIHRoaXMuX2luaXRNYXBNb3VzZUhhbmRsZXJzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdG9wKCl7XHJcbiAgICAgICAgICB0aGlzLl9tYXAuc2NlbmUuc2NyZWVuU3BhY2VDYW1lcmFDb250cm9sbGVyLmVuYWJsZVJvdGF0ZSA9IHRydWU7XHJcbiAgICAgICAgICB0aGlzLl9yZW1vdmVDZXNpdW1Nb3VzZUhhbmRsZXJzKCk7XHJcbiAgICAgICAgICB0aGlzLl9yZW1vdmVNYXBNb3VzZUhhbmRsZXJzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gWm9vbUFyZWFUb29sO1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAyLzAyLzE1LlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ1pvb21Ub29sJywgWydUb29sJyxcclxuICAgIGZ1bmN0aW9uKFRvb2wpe1xyXG5cclxuICAgICAgY2xhc3MgWm9vbVRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihtYXApe1xyXG4gICAgICAgICAgdGhpcy5fY2FtZXJhID0gbWFwLnNjZW5lLmNhbWVyYTtcclxuICAgICAgICAgIHRoaXMuX2VsbGlwc29pZCA9IG1hcC5zY2VuZS5nbG9iZS5lbGxpcHNvaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGFydCgpeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICBzdG9wKCl7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgICAgIHpvb21JbihqdW1wcyl7XHJcbiAgICAgICAgICBqdW1wcyA9IE51bWJlci5pc0Zpbml0ZShqdW1wcykgPyBqdW1wcyA6IDE7XHJcbiAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwganVtcHM7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjYW1lcmFIZWlnaHQgPSB0aGlzLl9lbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpcy5fY2FtZXJhLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEubW92ZUZvcndhcmQobW92ZVJhdGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgem9vbU91dChqdW1wcyl7XHJcbiAgICAgICAgICBqdW1wcyA9IE51bWJlci5pc0Zpbml0ZShqdW1wcykgPyBqdW1wcyA6IDE7XHJcbiAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwganVtcHM7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjYW1lcmFIZWlnaHQgPSB0aGlzLl9lbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpcy5fY2FtZXJhLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEubW92ZUJhY2t3YXJkKG1vdmVSYXRlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBab29tVG9vbDtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMi8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3pvb21XaWRnZXQnLCBbJyRkb2N1bWVudCcsXHJcbiAgICBmdW5jdGlvbigkZG9jdW1lbnQpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZTogJ150b29sJyxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJ6b29tLXdpZGdldFwiPicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiem9vbS1pbi1idG5cIj4nICtcclxuICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBuZy1jbGljaz1cInpvb21JbigpO1wiPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1pblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcclxuICAgICAgICAnPC9idXR0b24+JyArXHJcbiAgICAgICAgJzwvZGl2PicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic2xpZGVyXCI+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiYmFyXCI+JyArXHJcbiAgICAgICAgJzwvc3Bhbj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJwb2ludGVyXCI+JyArXHJcbiAgICAgICAgJzwvc3Bhbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJ6b29tLW91dC1idG5cIj4nICtcclxuICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBuZy1jbGljaz1cInpvb21PdXQoKTtcIj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXpvb20tb3V0XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xyXG4gICAgICAgICc8L2J1dHRvbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzwvZGl2PicsXHJcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB0b29sQ3RybCl7XHJcbiAgICAgICAgICBpZihpc0Zpbml0ZShhdHRycy53aWR0aCkgfHwgaXNGaW5pdGUoYXR0cnMuaGVpZ2h0KSl7XHJcbiAgICAgICAgICAgIGxldCB3aWR0aCA9ICBpc0Zpbml0ZShhdHRycy53aWR0aCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMud2lkdGgpICsgJ3B4JyA6ICdpbmhlcml0JztcclxuICAgICAgICAgICAgbGV0IGhlaWdodCA9ICBpc0Zpbml0ZShhdHRycy5oZWlnaHQpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLmhlaWdodCkgKyAncHgnIDogJ2luaGVyaXQnO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNzcyh7cG9zaXRpb246ICdyZWxhdGl2ZScsIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgbWluTGV2ZWwgPSBpc0Zpbml0ZShhdHRycy5taW4pID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1pbikgOiAwO1xyXG4gICAgICAgICAgbGV0IG1heExldmVsID0gaXNGaW5pdGUoYXR0cnMubWF4KSA/IE51bWJlci5wYXJzZUludChhdHRycy5tYXgpIDogMTAwO1xyXG5cclxuICAgICAgICAgIGlmKG1pbkxldmVsIDwgMCB8fCBtYXhMZXZlbCA8IDAgfHwgbWluTGV2ZWwgPj0gbWF4TGV2ZWwpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtaW4gb3IgbWF4IGF0dHJpYnV0ZXMgdmFsdWUgYXJlIGludmFsaWQuXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBqdW1wcyA9IGlzRmluaXRlKGF0dHJzLmp1bXApID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLmp1bXApIDogMTA7XHJcblxyXG4gICAgICAgICAgbGV0IHpvb21Ub29sID0gdG9vbEN0cmwuZ2V0VG9vbCgpO1xyXG5cclxuICAgICAgICAgIGlmKCh0eXBlb2Ygem9vbVRvb2wuem9vbUluICE9PSAnZnVuY3Rpb24nKSB8fCAodHlwZW9mIHpvb21Ub29sLnpvb21PdXQgIT09ICdmdW5jdGlvbicpKXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlpvb20gd2lkZ2V0IG11c3QgYmUgaW5zaWRlIHRvb2wgd2l0aCBab29tVG9vbCB0eXBlLlwiKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgbGV2ZWxWYWx1ZSA9IDkwIC8gKG1heExldmVsIC0gbWluTGV2ZWwpO1xyXG4gICAgICAgICAgbGV0IGN1cnJlbnRMZXZlbCA9IChtYXhMZXZlbCAtIG1pbkxldmVsKSAvIDI7XHJcbiAgICAgICAgICBsZXQgem9vbUxldmVsID0gKG1heExldmVsICsgbWluTGV2ZWwpIC8gMjtcclxuICAgICAgICAgIGxldCB0ZW1wTGV2ZWwgPSB6b29tTGV2ZWw7XHJcbiAgICAgICAgICBsZXQgY3VycmVudFBvaW50ZXJIZWlnaHQgPSA0NTtcclxuXHJcbiAgICAgICAgICBsZXQgcG9pbnRlciAgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudC5maW5kKCdzcGFuJylbMl0pO1xyXG4gICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWUgKyAnJScpO1xyXG5cclxuICAgICAgICAgIGxldCBjbGllbnRZID0gbnVsbDtcclxuICAgICAgICAgIGxldCBiYXJIZWlnaHQgPSBwb2ludGVyWzBdLmNsaWVudEhlaWdodCAqIDEwO1xyXG4gICAgICAgICAgbGV0IHN0YXJ0UG9pbnRlckhlaWdodCA9IGN1cnJlbnRQb2ludGVySGVpZ2h0O1xyXG5cclxuICAgICAgICAgIHBvaW50ZXIub24oJ21vdXNlZG93bicsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgICAgIHN0YXJ0UG9pbnRlckhlaWdodCA9IGN1cnJlbnRQb2ludGVySGVpZ2h0O1xyXG4gICAgICAgICAgICB0ZW1wTGV2ZWwgPSB6b29tTGV2ZWw7XHJcbiAgICAgICAgICAgIHBvaW50ZXIuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZXVwJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZihjbGllbnRZICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICBjbGllbnRZID0gbnVsbDtcclxuICAgICAgICAgICAgICBwb2ludGVyLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZW1vdmUnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNsaWVudFkgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgIGxldCBkZWx0YVkgPSBjbGllbnRZIC0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICAgICAgICBsZXQgcGVyY2VudCA9IChNYXRoLmFicyhkZWx0YVkpICogMTAwIC8gYmFySGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgaWYoZGVsdGFZID4gMCl7XHJcbiAgICAgICAgICAgICAgICBpZihzdGFydFBvaW50ZXJIZWlnaHQgLSBwZXJjZW50ID49IDApe1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IHN0YXJ0UG9pbnRlckhlaWdodCAtIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0ICsgcGVyY2VudCA8PSA5MCl7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gc3RhcnRQb2ludGVySGVpZ2h0ICsgcGVyY2VudDtcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IDkwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY3VycmVudExldmVsID0gTWF0aC50cnVuYyhjdXJyZW50UG9pbnRlckhlaWdodCAvIGxldmVsVmFsdWUpO1xyXG4gICAgICAgICAgICAgIHpvb21MZXZlbCA9IG1heExldmVsIC0gY3VycmVudExldmVsO1xyXG4gICAgICAgICAgICAgIGlmKHpvb21MZXZlbCA+IHRlbXBMZXZlbCl7XHJcbiAgICAgICAgICAgICAgICB6b29tVG9vbC56b29tSW4oKHpvb21MZXZlbCAtIHRlbXBMZXZlbCkgKiBqdW1wcyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmKHpvb21MZXZlbCA8IHRlbXBMZXZlbCl7XHJcbiAgICAgICAgICAgICAgICB6b29tVG9vbC56b29tT3V0KCh0ZW1wTGV2ZWwgLSB6b29tTGV2ZWwpICoganVtcHMpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB0ZW1wTGV2ZWwgPSB6b29tTGV2ZWw7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWUgKyAnJScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBzY29wZS56b29tSW4gPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZih6b29tTGV2ZWwgPCBtYXhMZXZlbCl7XHJcbiAgICAgICAgICAgICAgem9vbUxldmVsKys7XHJcbiAgICAgICAgICAgICAgY3VycmVudExldmVsLS07XHJcbiAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50UG9pbnRlckhlaWdodCArICclJyk7XHJcbiAgICAgICAgICAgICAgem9vbVRvb2wuem9vbUluKGp1bXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS56b29tT3V0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoem9vbUxldmVsID4gbWluTGV2ZWwpe1xyXG4gICAgICAgICAgICAgIHpvb21MZXZlbC0tO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbCsrO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcclxuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudFBvaW50ZXJIZWlnaHQgKyAnJScpO1xyXG4gICAgICAgICAgICAgIHpvb21Ub29sLnpvb21PdXQoanVtcHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9