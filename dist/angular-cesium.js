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
      if (target === null || (typeof target !== 'object' && typeof target !== 'function')) {
        throw new TypeError("Target must be object or function.");
      }
      if (handler === undefined) {
        return;
      }
      if (handler === null || typeof handler !== 'object') {
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
    var Tool = function Tool() {};
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
      require: '^^map',
      controller: function() {
        var currentTool = null;
        this.startTool = function(tool) {
          if (currentTool !== null) {
            currentTool.stop();
          }
          currentTool = tool;
          currentTool.start();
        };
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tool/tool-bar.drv.js
"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').directive('tool', ['Tool', 'Proxy', function(Tool, Proxy) {
    return {
      require: ['^^map', '^^toolbar'],
      transclude: true,
      template: '<div ng-class="class"></div>',
      scope: {
        type: '=',
        class: '@'
      },
      controller: ['$scope', function($scope) {
        this.getTool = (function() {
          return $scope.tool;
        });
      }],
      link: function(scope, element, attrs, ctrls, linker) {
        if (typeof scope.type !== 'function') {
          throw new TypeError("type attr must be constructor.");
        }
        var tool = new scope.type(ctrls[0].getCesiumWidget());
        if (!(tool instanceof Tool)) {
          throw new TypeError("tool must be instance of Tool.");
        }
        tool.start = Proxy(tool.start, {apply: (function(target, context) {
            return ctrls[1].startTool({
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
          return element.children().append(clone);
        }));
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tool/tool.drv.js
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
    require: '^^map',
    controller: function() {
      var currentTool = null;
      this.startTool = function(tool) {
        if (currentTool !== null) {
          currentTool.stop();
        }
        currentTool = tool;
        currentTool.start();
      };
    }
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
  angular.module('angularCesium').factory('ZoomTool', ['Tool', function(Tool) {
    var _camera = Symbol('_camera');
    var _ellipsoid = Symbol('_ellipsoid');
    var ZoomTool = function ZoomTool(map) {
      this[_camera] = map.scene.camera;
      this[_ellipsoid] = map.scene.globe.ellipsoid;
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
          var cameraHeight = this[_ellipsoid].cartesianToCartographic(this[_camera].position).height;
          var moveRate = cameraHeight / 100.0;
          this[_camera].moveForward(moveRate);
        }
      },
      zoomOut: function(jumps) {
        jumps = Number.isFinite(jumps) ? jumps : 1;
        for (var i = 0; i < jumps; i++) {
          var cameraHeight = this[_ellipsoid].cartesianToCartographic(this[_camera].position).height;
          var moveRate = cameraHeight / 100.0;
          this[_camera].moveBackward(moveRate);
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
      require: '^^tool',
      template: '<div class="zoom-widget">' + '<div class="zoom-in-btn">' + '<button type="button" class="btn btn-default" ng-click="zoomIn();">' + '<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>' + '</button>' + '</div>' + '<div class="slider">' + '<span class="bar">' + '</span>' + '<span class="pointer">' + '</span>' + '</div>' + '<div class="zoom-out-btn">' + '<button type="button" class="btn btn-default" ng-click="zoomOut();">' + '<span class="glyphicon glyphicon-zoom-out" aria-hidden="true"></span>' + '</button>' + '</div>' + '</div>',
      link: function(scope, element, attrs, toolCtrl) {
        if (!Number.parseInt(attrs.width) || !Number.parseInt(attrs.height)) {
          var width = Number.parseInt(attrs.width) ? (Number.parseInt(attrs.width) + "px") : 'inherit';
          var height = Number.parseInt(attrs.height) ? (Number.parseInt(attrs.height) + "px") : 'inherit';
          element.css({
            position: 'relative',
            width: width,
            height: height
          });
        }
        var minLevel = !Object.is((Number.parseInt(attrs.min)), NaN) ? Number.parseInt(attrs.min) : 0;
        var maxLevel = !Object.is((Number.parseInt(attrs.max)), NaN) ? Number.parseInt(attrs.max) : 100;
        if (minLevel < 0 || maxLevel < 0 || minLevel >= maxLevel) {
          throw new Error("min or max attributes value are invalid.");
        }
        var startLevel = 0;
        if (!Object.is((startLevel = Number.parseInt(attrs.start)), NaN)) {
          if (startLevel < minLevel || startLevel > maxLevel) {
            throw new Error("Invalid start attribute value.");
          }
        } else {
          startLevel = Math.trunc((maxLevel + minLevel) / 2);
        }
        var jumps = isFinite(attrs.jump) ? Number.parseInt(attrs.jump) : 10;
        var zoomTool = toolCtrl.getTool();
        if ((typeof zoomTool.zoomIn !== 'function') || (typeof zoomTool.zoomOut !== 'function')) {
          throw new TypeError("Zoom widget must be inside tool with ZoomTool type.");
        }
        var levelValue = 90 / (maxLevel - minLevel);
        var currentLevel = (maxLevel - minLevel) - (startLevel - minLevel);
        var zoomLevel = startLevel;
        var tempLevel = zoomLevel;
        var currentPointerHeight = currentLevel * levelValue;
        var pointer = angular.element(element.find('span')[2]);
        pointer.css('top', (currentPointerHeight + "%"));
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
"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('ZoomAreaTool', ['Tool', 'Cesium', function(Tool, Cesium) {
    var $__2;
    var _map = Symbol('_map');
    var _active = Symbol('_active');
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
      this[_active] = false;
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
          if (!$__0[_active]) {
            return;
          }
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
          if (!$__0[_active] || !selectedStart) {
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
          if (!$__0[_active]) {
            return;
          }
          selectedStart = false;
          selector.remove();
          $__0[_mapContainer].css('cursor', '');
          $__0[_ensureFly] = true;
        });
        this[_mapContainerMouseLeave] = (function(event) {
          if (!$__0[_active]) {
            return;
          }
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
          if (!$__0[_active]) {
            return;
          }
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
          if (!$__0[_active]) {
            return;
          }
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
        this[_active] = true;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, "stop", {
      value: function() {
        this[_active] = false;
        this[_map].scene.screenSpaceCameraController.enableRotate = true;
        this[_unbindMapContainerMouseHandlers]();
        this[_unbindCesiumWidgetMouseHandlers]();
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, "toggle", {
      value: function() {
        if (this[_active]) {
          this.stop();
        } else {
          this.start();
        }
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__2), {}, Tool);
    return ZoomAreaTool;
  }]);
}(window.angular));
//# sourceURL=map-components/tools/zoom-area/zoom-area-tool.js
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Byb3h5LmpzIiwic2VydmljZXMvdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL2JpbGxib2FyZC9iaWxsYm9hcmQuanMiLCJtYXAtY29tcG9uZW50cy9jb21wbGV4LWxheWVyL2NvbXBsZXgtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9sYWJlbC9sYWJlbC5qcyIsIm1hcC1jb21wb25lbnRzL2xhYmVscy1sYXllci9sYWJlbHMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9tYXAvbWFwLWRpcmVjdGl2ZS5qcyIsIm1hcC1jb21wb25lbnRzL2JpbGxib2FyZHMtbGF5ZXIvYmlsbGJvYXJkcy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3BvbHlsaW5lL3BvbHlsaW5lLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmVzLWxheWVyL3BvbHlsaW5lcy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC1iYXIuZHJ2LmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbC90b29sLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xiYXIvZHJhZ2dhYmxlLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbGJhci90b29sYmFyLmpzIiwibWFwLWNvbXBvbmVudHMvd2ViLW1hcC1zZXJ2aWNlLWxheWVyL3dlYi1tYXAtc2VydmljZS1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS10b29sLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbHMvem9vbS96b29tLXdpZGdldC5kcnYuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tLWFyZWEvem9vbS1hcmVhLXRvb2wuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFuZ3VsYXItY2VzaXVtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJywgWydvYnNlcnZhYmxlQ29sbGVjdGlvbiddKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5zZXJ2aWNlKCdCaWxsQm9hcmRBdHRyaWJ1dGVzJywgZnVuY3Rpb24oJHBhcnNlKSB7XHJcbiAgdGhpcy5jYWxjQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGF0dHJzLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBpbWFnZSA6ICRwYXJzZShhdHRycy5pbWFnZSkoY29udGV4dClcclxuICAgIH07XHJcbiAgICB2YXIgcG9zaXRpb25BdHRyID0gJHBhcnNlKGF0dHJzLnBvc2l0aW9uKShjb250ZXh0KTtcclxuICAgIHJlc3VsdC5wb3NpdGlvbiA9IENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbkF0dHIubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb25BdHRyLmFsdGl0dWRlKSB8fCAwKTtcclxuXHJcbiAgICB2YXIgY29sb3IgPSAkcGFyc2UoYXR0cnMuY29sb3IpKGNvbnRleHQpO1xyXG4gICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgIHJlc3VsdC5jb2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoY29sb3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnQ2VzaXVtJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIENlc2l1bTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDkvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnUHJveHknLCBbXHJcbiAgICBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgZnVuY3Rpb24gUHJveHkodGFyZ2V0LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYodGFyZ2V0ID09PSBudWxsIHx8ICh0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKSl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGFyZ2V0IG11c3QgYmUgb2JqZWN0IG9yIGZ1bmN0aW9uLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGhhbmRsZXIgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihoYW5kbGVyID09PSBudWxsIHx8IHR5cGVvZiBoYW5kbGVyICE9PSAnb2JqZWN0Jyl7XHJcbiAgICAgICAgICB0aHJvdyAgbmV3IFR5cGVFcnJvcihcIkhhbmRsZXIgbXV0IGJlIG9iamVjdFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbicpe1xyXG5cclxuICAgICAgICAgIGlmKHR5cGVvZiBoYW5kbGVyLmFwcGx5ICE9PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKXsgcmV0dXJuIGhhbmRsZXIuYXBwbHkodGFyZ2V0LCB0aGlzLCBhcmdzKSB9O1xyXG5cclxuICAgICAgICB9ZWxzZXtcclxuXHJcbiAgICAgICAgICBpZih0eXBlb2YgaGFuZGxlci5nZXQgIT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGhhbmRsZXIuc2V0ICE9PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZvcihsZXQgcHJvcCBpbiB0YXJnZXQpe1xyXG5cclxuICAgICAgICAgICAgbGV0IHByb3h5ID0ge307XHJcblxyXG4gICAgICAgICAgICBpZihoYW5kbGVyLmdldCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICBwcm94eS5nZXQgPSAoKSA9PiBoYW5kbGVyLmdldCh0YXJnZXQsIHByb3ApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZihoYW5kbGVyLnNldCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICBwcm94eS5zZXQgPSB2YWwgPT4geyBoYW5kbGVyLnNldCh0YXJnZXQsIHByb3AsIHZhbCk7IH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIHByb3AsIHByb3h5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm94eTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdUb29sJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgIGNsYXNzIFRvb2wge1xyXG4gICAgICAgIHN0YXJ0KCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxyXG4gICAgICAgIHN0b3AoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiOyB9XHJcbiAgICAgICAgY2FuY2VsKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjt9XHJcbiAgICAgICAgb25VcGRhdGUoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkJywgZnVuY3Rpb24oQmlsbEJvYXJkQXR0cmlidXRlcykge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmJpbGxib2FyZHNMYXllcicsXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBiaWxsYm9hcmRzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBiaWxsRGVzYyA9IEJpbGxCb2FyZEF0dHJpYnV0ZXMuY2FsY0F0dHJpYnV0ZXMoYXR0cnMsIHNjb3BlKTtcclxuXHJcbiAgICAgIHZhciBiaWxsYm9hcmQgPSBiaWxsYm9hcmRzTGF5ZXJDdHJsLmdldEJpbGxib2FyZENvbGxlY3Rpb24oKS5hZGQoYmlsbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLnJlbW92ZShiaWxsYm9hcmQpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDE3LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2NvbXBsZXhMYXllcicsIGZ1bmN0aW9uKCRsb2cpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29tcGlsZSA6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50LmNoaWxkcmVuKCksIGZ1bmN0aW9uIChjaGlsZCkge1xyXG5cclxuICAgICAgICAgIHZhciBsYXllciA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICBpZiAoY2hpbGQudGFnTmFtZSA9PT0gJ0JJTExCT0FSRCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxiaWxsYm9hcmRzLWxheWVyPjwvYmlsbGJvYXJkcy1sYXllcj4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLnRhZ05hbWUgPT09ICdMQUJFTCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxsYWJlbHMtbGF5ZXI+PC9sYWJlbHMtbGF5ZXI+Jyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXllcikge1xyXG4gICAgICAgICAgICAkbG9nLndhcm4oJ0ZvdW5kIGFuIHVua25vd24gY2hpbGQgb2Ygb2YgY29tcGxleC1sYXllci4gUmVtb3ZpbmcuLi4nKTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGNoaWxkKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY2hpbGQuYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcclxuICAgICAgICAgICAgICBsYXllci5hdHRyKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudFswXS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG4gICAgICAgICAgICAgIGlmICghYW5ndWxhci5lbGVtZW50KGNoaWxkKS5hdHRyKGF0dHIubmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGxheWVyLmF0dHIoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLnJlcGxhY2VXaXRoKGxheWVyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdsYWJlbCcsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmxhYmVsc0xheWVyJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBjb2xvciA6ICcmJyxcclxuICAgICAgdGV4dCA6ICcmJyxcclxuICAgICAgcG9zaXRpb24gOiAnJidcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBsYWJlbHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGxhYmVsRGVzYyA9IHt9O1xyXG5cclxuICAgICAgdmFyIHBvc2l0aW9uID0gc2NvcGUucG9zaXRpb24oKTtcclxuICAgICAgbGFiZWxEZXNjLnBvc2l0aW9uID0gQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24ubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24uYWx0aXR1ZGUpIHx8IDApO1xyXG5cclxuICAgICAgdmFyIGNvbG9yID0gc2NvcGUuY29sb3IoKTtcclxuICAgICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgICAgbGFiZWxEZXNjLmNvbG9yID0gY29sb3I7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxhYmVsRGVzYy50ZXh0ID0gc2NvcGUudGV4dCgpO1xyXG5cclxuICAgICAgdmFyIGxhYmVsID0gbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLmFkZChsYWJlbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxhYmVsc0xheWVyQ3RybC5nZXRMYWJlbENvbGxlY3Rpb24oKS5yZW1vdmUobGFiZWwpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsc0xheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge30sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuZ2V0TGFiZWxDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uTGFiZWxDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ21hcCcsIGZ1bmN0aW9uKCkge1xyXG4gIGZ1bmN0aW9uIGdldFNjZW5lTW9kZShkaW1lbnNpb25zKSB7XHJcbiAgICBpZiAoZGltZW5zaW9ucyA9PSAyKSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FMkQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChkaW1lbnNpb25zID09IDIuNSkge1xyXG4gICAgICByZXR1cm4gQ2VzaXVtLlNjZW5lTW9kZS5DT0xVTUJVU19WSUVXO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FM0Q7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdj4gPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPiA8ZGl2IGNsYXNzPVwibWFwLWNvbnRhaW5lclwiPjwvZGl2PiA8L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgZGltZW5zaW9ucyA6ICdAJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNlc2l1bTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLm9uRHJvcCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAoIXNjb3BlLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICAgIHNjb3BlLmRpbWVuc2lvbnMgPSAzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NvcGUuY2VzaXVtID0gbmV3IENlc2l1bS5DZXNpdW1XaWRnZXQoZWxlbWVudC5maW5kKCdkaXYnKVswXSwge1xyXG4gICAgICAgICAgc2NlbmVNb2RlOiBnZXRTY2VuZU1vZGUoc2NvcGUuZGltZW5zaW9ucylcclxuICAgICAgICB9KTtcclxuICAgICAgICBzY29wZS5tYXBSZWN0ID0gZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2JpbGxib2FyZHNMYXllcicsIGZ1bmN0aW9uKCRwYXJzZSwgT2JzZXJ2YWJsZUNvbGxlY3Rpb24sIEJpbGxCb2FyZEF0dHJpYnV0ZXMsIENlc2l1bSkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlLCAkYXR0cnMpIHtcclxuICAgICAgdGhpcy5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCRhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZ2V0IGNvbGxlY3Rpb24gaWYgbGF5ZXIgaXMgYm91bmQgdG8gT2JzZXJ2YWJsZUNvbGxlY3Rpb24nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY29sbGVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICAgIHNjb3BlLmNvbGxlY3Rpb24gPSBuZXcgQ2VzaXVtLkJpbGxib2FyZENvbGxlY3Rpb24oKTtcclxuICAgICAgICBpZiAoYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgIHZhciBDT0xMRUNUSU9OX1JFR0VYUCA9IC9cXHMqKFtcXCRcXHddW1xcJFxcd10qKVxccytpblxccysoW1xcJFxcd11bXFwkXFx3XSopLztcclxuICAgICAgICAgIHZhciBtYXRjaCA9IGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uLm1hdGNoKENPTExFQ1RJT05fUkVHRVhQKTtcclxuICAgICAgICAgIHZhciBpdGVtTmFtZSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgdmFyIGNvbGxlY3Rpb24gPSAkcGFyc2UobWF0Y2hbMl0pKHNjb3BlKTtcclxuICAgICAgICAgIGlmICghY29sbGVjdGlvbiBpbnN0YW5jZW9mIE9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb2JzZXJ2YWJsZS1jb2xsZWN0aW9uIG11c3QgYmUgb2YgdHlwZSBPYnNlcnZhYmxlQ29sbGVjdGlvbi4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYWRkQmlsbGJvYXJkID0gZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgIHZhciBjb250ZXh0ID0ge307XHJcbiAgICAgICAgICAgICAgY29udGV4dFtpdGVtTmFtZV0gPSBpdGVtO1xyXG4gICAgICAgICAgICAgIHZhciBiaWxsRGVzYyA9IEJpbGxCb2FyZEF0dHJpYnV0ZXMuY2FsY0F0dHJpYnV0ZXMoYXR0cnMsIGNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICBzY29wZS5jb2xsZWN0aW9uLmFkZChiaWxsRGVzYyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY29sbGVjdGlvbi5nZXREYXRhKCksIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICBhZGRCaWxsYm9hcmQoaXRlbSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25BZGQoYWRkQmlsbGJvYXJkKTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vblVwZGF0ZShmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25SZW1vdmUoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgICBzY29wZS5jb2xsZWN0aW9uLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uLmdldChpbmRleCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5hZGQoc2NvcGUuY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ2lsbmlzMiBvbiAxOC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdwb2x5bGluZScsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXnBvbHlsaW5lc0xheWVyJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBjb2xvciA6ICcmJyxcclxuICAgICAgd2lkdGggOiAnJicsXHJcbiAgICAgIHBvc2l0aW9ucyA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBvbHlsaW5lc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgcG9seWxpbmVEZXNjID0ge307XHJcblxyXG4gICAgICBpZiAoIWFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLnBvc2l0aW9ucykgfHwgIWFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS5wb3NpdGlvbnMpKXtcclxuICAgICAgICB0aHJvdyBcIlBvbHlsaW5lIHBvc2l0aW9ucyBtdXN0IGJlIGRlZmluZWQgYXMgYSBmdW5jdGlvblwiO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBwb3NpdGlvbnMgPSBzY29wZS5wb3NpdGlvbnMoKTtcclxuICAgICAgcG9seWxpbmVEZXNjLnBvc2l0aW9ucyA9IFtdO1xyXG4gICAgICBhbmd1bGFyLmZvckVhY2gocG9zaXRpb25zLCBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gICAgICAgIHBvbHlsaW5lRGVzYy5wb3NpdGlvbnMucHVzaChDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCkpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBjZXNpdW1Db2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoJ2JsYWNrJyk7XHJcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChzY29wZS5jb2xvcikgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLmNvbG9yKSl7XHJcbiAgICAgICAgY2VzaXVtQ29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKHNjb3BlLmNvbG9yKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgcG9seWxpbmVEZXNjLm1hdGVyaWFsID0gQ2VzaXVtLk1hdGVyaWFsLmZyb21UeXBlKCdDb2xvcicpO1xyXG4gICAgICBwb2x5bGluZURlc2MubWF0ZXJpYWwudW5pZm9ybXMuY29sb3IgPSBjZXNpdW1Db2xvcjtcclxuXHJcbiAgICAgIHBvbHlsaW5lRGVzYy53aWR0aCA9IDE7XHJcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChzY29wZS53aWR0aCkgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLndpZHRoKSl7XHJcbiAgICAgICAgcG9seWxpbmVEZXNjLndpZHRoID0gc2NvcGUud2lkdGgoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBvbHlsaW5lID0gcG9seWxpbmVzTGF5ZXJDdHJsLmdldFBvbHlsaW5lQ29sbGVjdGlvbigpLmFkZChwb2x5bGluZURlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHBvbHlsaW5lc0xheWVyQ3RybC5nZXRQb2x5bGluZUNvbGxlY3Rpb24oKS5yZW1vdmUocG9seWxpbmUpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBnaWxuaXMyIG9uIDE4LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3BvbHlsaW5lc0xheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge30sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuZ2V0UG9seWxpbmVDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uUG9seWxpbmVDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cbiAqL1xuXG4oZnVuY3Rpb24oYW5ndWxhcil7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sQmFyJywgW1xuICAgIGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXF1aXJlOiAnXl5tYXAnLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xuXG4gICAgICAgICAgdGhpcy5zdGFydFRvb2wgPSBmdW5jdGlvbih0b29sKXtcbiAgICAgICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgY3VycmVudFRvb2wuc3RvcCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJyZW50VG9vbCA9IHRvb2w7XG4gICAgICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxufSh3aW5kb3cuYW5ndWxhcikpO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXG4gKi9cblxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgndG9vbCcsIFsnVG9vbCcsICdQcm94eScsXG4gICAgZnVuY3Rpb24oVG9vbCwgUHJveHkpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVxdWlyZTogWydeXm1hcCcsICdeXnRvb2xiYXInXSxcbiAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IG5nLWNsYXNzPVwiY2xhc3NcIj48L2Rpdj4nLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgIHR5cGU6ICc9JyxcbiAgICAgICAgICBjbGFzczogJ0AnXG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJyxcbiAgICAgICAgICBmdW5jdGlvbigkc2NvcGUpe1xuICAgICAgICAgICAgdGhpcy5nZXRUb29sID0gKCkgPT4gJHNjb3BlLnRvb2w7XG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGN0cmxzLCBsaW5rZXIpe1xuICAgICAgICAgIGlmKHR5cGVvZiBzY29wZS50eXBlICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0eXBlIGF0dHIgbXVzdCBiZSBjb25zdHJ1Y3Rvci5cIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRvb2wgPSBuZXcgc2NvcGUudHlwZShjdHJsc1swXS5nZXRDZXNpdW1XaWRnZXQoKSk7XG5cbiAgICAgICAgICBpZighKHRvb2wgaW5zdGFuY2VvZiBUb29sKSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidG9vbCBtdXN0IGJlIGluc3RhbmNlIG9mIFRvb2wuXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRvb2wuc3RhcnQgPSBQcm94eSh0b29sLnN0YXJ0LCB7XG4gICAgICAgICAgICBhcHBseTogKHRhcmdldCwgY29udGV4dCkgPT4gY3RybHNbMV0uc3RhcnRUb29sKHtcbiAgICAgICAgICAgICAgc3RhcnQ6ICgpID0+IHRhcmdldC5hcHBseSh0b29sKSxcbiAgICAgICAgICAgICAgc3RvcDogKCkgPT4gdG9vbC5zdG9wKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBzY29wZS50b29sID0gdG9vbDtcblxuICAgICAgICAgIGxpbmtlcihzY29wZSwgY2xvbmUgPT4gZWxlbWVudC5jaGlsZHJlbigpLmFwcGVuZChjbG9uZSkpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbn0od2luZG93LmFuZ3VsYXIpKTtcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGVyZXp5IG9uIDIvMS8yMDE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKVxyXG4gIC5kaXJlY3RpdmUoJ2RyYWdnYWJsZScsIFsnJGRvY3VtZW50JywgZnVuY3Rpb24oJGRvY3VtZW50KSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcclxuICAgICAgdmFyIHN0YXJ0WCA9IDAsIHN0YXJ0WSA9IDAsIHggPSAwLCB5ID0gMCwgIHgxID0gMCwgeTEgPSAwLCBvZmZzZXRUb3AgPSAtMSxvZmZzZXRMZWZ0ID0gLTE7XHJcbiAgICAgIHZhciBtYXBSZWN0ID0gc2NvcGUuJHBhcmVudC5tYXBSZWN0LG5ld01hcFJlY3QgPSB7fSwgZWxlbVJlY3QgPSB7fTtcclxuICAgICAgdmFyIHRvb2xiYXIgPSBlbGVtZW50LnBhcmVudCgpO1xyXG4gICAgICBlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdCBkcmFnZ2luZyBvZiBzZWxlY3RlZCBjb250ZW50XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZihvZmZzZXRUb3AgPT0gLTEpe1xyXG4gICAgICAgICAgb2Zmc2V0VG9wID0gdG9vbGJhclswXS5vZmZzZXRUb3A7XHJcbiAgICAgICAgICBvZmZzZXRMZWZ0ID0gdG9vbGJhclswXS5vZmZzZXRMZWZ0O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC50b3AgPSBvZmZzZXRUb3AgKyBtYXBSZWN0LnRvcDtcclxuICAgICAgICAgIG5ld01hcFJlY3QubGVmdCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LmxlZnQ7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LnJpZ2h0ID0gb2Zmc2V0TGVmdCArIG1hcFJlY3QucmlnaHQgLSA1O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC5ib3R0b20gPSBvZmZzZXRUb3AgKyBtYXBSZWN0LmJvdHRvbSAtIDE1O1xyXG4gICAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ2RyYWdnYWJsZTInLG5ld01hcFJlY3QpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgb2Zmc2V0VG9wID0gMDtcclxuICAgICAgICAgIG9mZnNldExlZnQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGFydFggPSBldmVudC5wYWdlWCAtIHggLSBvZmZzZXRMZWZ0O1xyXG4gICAgICAgIHN0YXJ0WSA9IGV2ZW50LnBhZ2VZIC0geSAtIG9mZnNldFRvcDtcclxuICAgICAgICBlbGVtZW50LmNzcyh7XHJcbiAgICAgICAgICBjdXJzb3I6ICctd2Via2l0LWdyYWJiaW5nJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcclxuICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3VzZW1vdmUoZXZlbnQpIHtcclxuICAgICAgICB5ID0gZXZlbnQucGFnZVkgLSBzdGFydFk7XHJcbiAgICAgICAgeCA9IGV2ZW50LnBhZ2VYIC0gc3RhcnRYO1xyXG5cclxuICAgICAgICBpZighaW5zaWRlTWFwKCkpIHtcclxuICAgICAgICAgIHRvb2xiYXIuY3NzKHtcclxuICAgICAgICAgICAgdG9wOiB5MSArICdweCcsXHJcbiAgICAgICAgICAgIGxlZnQ6IHgxICsgJ3B4J1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICB4MSA9IHg7XHJcbiAgICAgICAgICB5MSA9IHk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3VzZXVwKCkge1xyXG4gICAgICAgIGVsZW1lbnQuY3NzKHtcclxuICAgICAgICAgIGN1cnNvcjogJy13ZWJraXQtZ3JhYidcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZG9jdW1lbnQub2ZmKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xyXG4gICAgICAgICRkb2N1bWVudC5vZmYoJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gaW5zaWRlTWFwKCl7XHJcbiAgICAgICAgdG9vbGJhci5jc3Moe1xyXG4gICAgICAgICAgdG9wOiB5ICsgJ3B4JyxcclxuICAgICAgICAgIGxlZnQ6IHggKyAncHgnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGlmKGVsZW1SZWN0LnRvcCA8IG5ld01hcFJlY3QudG9wIHx8IGVsZW1SZWN0LmxlZnQgPCBuZXdNYXBSZWN0LmxlZnQgfHwgZWxlbVJlY3QucmlnaHQgPiBuZXdNYXBSZWN0LnJpZ2h0IHx8IGVsZW1SZWN0LmJvdHRvbSA+IG5ld01hcFJlY3QuYm90dG9tKXtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfV0pO1xyXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgZXJlenkgb24gMDEvMDIvMTUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2xiYXInLCBmdW5jdGlvbigpIHtcblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgIHRlbXBsYXRlIDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyXCIgPjxkaXYgY2xhc3M9XCJkcmFnLWJ1dHRvbiBnbHlwaGljb24gZ2x5cGhpY29uLW1pbnVzXCIgZHJhZ2dhYmxlPjwvZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcbiAgICByZXF1aXJlIDogJ15ebWFwJyxcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xuXG4gICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xuICAgICAgICBpZihjdXJyZW50VG9vbCAhPT0gbnVsbCl7XG4gICAgICAgICAgY3VycmVudFRvb2wuc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudFRvb2wgPSB0b29sO1xuICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59KTtcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnd2ViTWFwU2VydmljZUxheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICB1cmwgOiAnJicsXHJcbiAgICAgIGxheWVycyA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgIHZhciBwcm92aWRlciA9IG5ldyBDZXNpdW0uV2ViTWFwU2VydmljZUltYWdlcnlQcm92aWRlcih7XHJcbiAgICAgICAgdXJsOiBzY29wZS51cmwoKSxcclxuICAgICAgICBsYXllcnMgOiBzY29wZS5sYXllcnMoKVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBsYXllciA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5hZGRJbWFnZXJ5UHJvdmlkZXIocHJvdmlkZXIpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5yZW1vdmUobGF5ZXIpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMi8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdab29tVG9vbCcsIFsnVG9vbCcsXHJcbiAgICBmdW5jdGlvbihUb29sKXtcclxuXHJcbiAgICAgIGxldCBfY2FtZXJhID0gU3ltYm9sKCdfY2FtZXJhJyk7XHJcbiAgICAgIGxldCBfZWxsaXBzb2lkID0gU3ltYm9sKCdfZWxsaXBzb2lkJyk7XHJcblxyXG4gICAgICBjbGFzcyBab29tVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKG1hcCl7XHJcbiAgICAgICAgICB0aGlzW19jYW1lcmFdID0gbWFwLnNjZW5lLmNhbWVyYTtcclxuICAgICAgICAgIHRoaXNbX2VsbGlwc29pZF0gPSBtYXAuc2NlbmUuZ2xvYmUuZWxsaXBzb2lkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhcnQoKXsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgc3RvcCgpeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICB6b29tSW4oanVtcHMpe1xyXG4gICAgICAgICAganVtcHMgPSBOdW1iZXIuaXNGaW5pdGUoanVtcHMpID8ganVtcHMgOiAxO1xyXG4gICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGp1bXBzOyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgY2FtZXJhSGVpZ2h0ID0gdGhpc1tfZWxsaXBzb2lkXS5jYXJ0ZXNpYW5Ub0NhcnRvZ3JhcGhpYyh0aGlzW19jYW1lcmFdLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzW19jYW1lcmFdLm1vdmVGb3J3YXJkKG1vdmVSYXRlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHpvb21PdXQoanVtcHMpe1xyXG4gICAgICAgICAganVtcHMgPSBOdW1iZXIuaXNGaW5pdGUoanVtcHMpID8ganVtcHMgOiAxO1xyXG4gICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGp1bXBzOyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgY2FtZXJhSGVpZ2h0ID0gdGhpc1tfZWxsaXBzb2lkXS5jYXJ0ZXNpYW5Ub0NhcnRvZ3JhcGhpYyh0aGlzW19jYW1lcmFdLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzW19jYW1lcmFdLm1vdmVCYWNrd2FyZChtb3ZlUmF0ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gWm9vbVRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAyLzAyLzE1LlxuICovXG5cbihmdW5jdGlvbihhbmd1bGFyKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3pvb21XaWRnZXQnLCBbJyRkb2N1bWVudCcsXG4gICAgZnVuY3Rpb24oJGRvY3VtZW50KXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmU6ICdeXnRvb2wnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJ6b29tLXdpZGdldFwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInpvb20taW4tYnRuXCI+JyArXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIG5nLWNsaWNrPVwiem9vbUluKCk7XCI+JyArXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1pblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcbiAgICAgICAgJzwvYnV0dG9uPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic2xpZGVyXCI+JyArXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImJhclwiPicgK1xuICAgICAgICAnPC9zcGFuPicgK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJwb2ludGVyXCI+JyArXG4gICAgICAgICc8L3NwYW4+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJ6b29tLW91dC1idG5cIj4nICtcbiAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgbmctY2xpY2s9XCJ6b29tT3V0KCk7XCI+JyArXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1vdXRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXG4gICAgICAgICc8L2J1dHRvbj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB0b29sQ3RybCl7XG4gICAgICAgICAgaWYoIU51bWJlci5wYXJzZUludChhdHRycy53aWR0aCkgfHwgIU51bWJlci5wYXJzZUludChhdHRycy5oZWlnaHQpKXtcbiAgICAgICAgICAgIGxldCB3aWR0aCA9ICBOdW1iZXIucGFyc2VJbnQoYXR0cnMud2lkdGgpID8gYCR7TnVtYmVyLnBhcnNlSW50KGF0dHJzLndpZHRoKX1weGAgOiAnaW5oZXJpdCc7XG4gICAgICAgICAgICBsZXQgaGVpZ2h0ID0gIE51bWJlci5wYXJzZUludChhdHRycy5oZWlnaHQpID8gYCR7TnVtYmVyLnBhcnNlSW50KGF0dHJzLmhlaWdodCl9cHhgIDogJ2luaGVyaXQnO1xuICAgICAgICAgICAgZWxlbWVudC5jc3Moe3Bvc2l0aW9uOiAncmVsYXRpdmUnLCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IG1pbkxldmVsID0gIU9iamVjdC5pcygoTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1pbikpLE5hTikgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMubWluKSA6IDA7XG4gICAgICAgICAgbGV0IG1heExldmVsID0gIU9iamVjdC5pcygoTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1heCkpLE5hTikgID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1heCkgOiAxMDA7XG5cbiAgICAgICAgICBpZihtaW5MZXZlbCA8IDAgfHwgbWF4TGV2ZWwgPCAwIHx8IG1pbkxldmVsID49IG1heExldmVsKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm1pbiBvciBtYXggYXR0cmlidXRlcyB2YWx1ZSBhcmUgaW52YWxpZC5cIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHN0YXJ0TGV2ZWwgPSAwO1xuXG4gICAgICAgICAgaWYoIU9iamVjdC5pcygoc3RhcnRMZXZlbCA9IE51bWJlci5wYXJzZUludChhdHRycy5zdGFydCkpLE5hTikpe1xuICAgICAgICAgICAgaWYoc3RhcnRMZXZlbCA8IG1pbkxldmVsIHx8IHN0YXJ0TGV2ZWwgPiBtYXhMZXZlbCl7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc3RhcnQgYXR0cmlidXRlIHZhbHVlLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHN0YXJ0TGV2ZWwgPSBNYXRoLnRydW5jKChtYXhMZXZlbCArIG1pbkxldmVsKSAvIDIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBqdW1wcyA9IGlzRmluaXRlKGF0dHJzLmp1bXApID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLmp1bXApIDogMTA7XG5cbiAgICAgICAgICBsZXQgem9vbVRvb2wgPSB0b29sQ3RybC5nZXRUb29sKCk7XG5cbiAgICAgICAgICBpZigodHlwZW9mIHpvb21Ub29sLnpvb21JbiAhPT0gJ2Z1bmN0aW9uJykgfHwgKHR5cGVvZiB6b29tVG9vbC56b29tT3V0ICE9PSAnZnVuY3Rpb24nKSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiWm9vbSB3aWRnZXQgbXVzdCBiZSBpbnNpZGUgdG9vbCB3aXRoIFpvb21Ub29sIHR5cGUuXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBsZXZlbFZhbHVlID0gOTAgLyAobWF4TGV2ZWwgLSBtaW5MZXZlbCk7XG4gICAgICAgICAgbGV0IGN1cnJlbnRMZXZlbCA9IChtYXhMZXZlbCAtIG1pbkxldmVsKSAtIChzdGFydExldmVsIC0gbWluTGV2ZWwpO1xuICAgICAgICAgIGxldCB6b29tTGV2ZWwgPSBzdGFydExldmVsO1xuICAgICAgICAgIGxldCB0ZW1wTGV2ZWwgPSB6b29tTGV2ZWw7XG4gICAgICAgICAgbGV0IGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcblxuICAgICAgICAgIGxldCBwb2ludGVyICA9IGFuZ3VsYXIuZWxlbWVudChlbGVtZW50LmZpbmQoJ3NwYW4nKVsyXSk7XG4gICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGAke2N1cnJlbnRQb2ludGVySGVpZ2h0fSVgKTtcblxuICAgICAgICAgIGxldCBjbGllbnRZID0gbnVsbDtcbiAgICAgICAgICBsZXQgYmFySGVpZ2h0ID0gcG9pbnRlclswXS5jbGllbnRIZWlnaHQgKiAxMDtcbiAgICAgICAgICBsZXQgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XG5cbiAgICAgICAgICBwb2ludGVyLm9uKCdtb3VzZWRvd24nLCBldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgICAgICBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcbiAgICAgICAgICAgIHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcbiAgICAgICAgICAgIHBvaW50ZXIuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZXVwJywgZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYoY2xpZW50WSAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgIGNsaWVudFkgPSBudWxsO1xuICAgICAgICAgICAgICBwb2ludGVyLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYoY2xpZW50WSAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgIGxldCBkZWx0YVkgPSBjbGllbnRZIC0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgICAgICAgbGV0IHBlcmNlbnQgPSAoTWF0aC5hYnMoZGVsdGFZKSAqIDEwMCAvIGJhckhlaWdodCk7XG5cbiAgICAgICAgICAgICAgaWYoZGVsdGFZID4gMCl7XG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudCA+PSAwKXtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudDtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGlmKHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQgPD0gOTApe1xuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBzdGFydFBvaW50ZXJIZWlnaHQgKyBwZXJjZW50O1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSA5MDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwgPSBNYXRoLnRydW5jKGN1cnJlbnRQb2ludGVySGVpZ2h0IC8gbGV2ZWxWYWx1ZSk7XG4gICAgICAgICAgICAgIHpvb21MZXZlbCA9IG1heExldmVsIC0gY3VycmVudExldmVsO1xuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPiB0ZW1wTGV2ZWwpe1xuICAgICAgICAgICAgICAgIHpvb21Ub29sLnpvb21Jbigoem9vbUxldmVsIC0gdGVtcExldmVsKSAqIGp1bXBzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPCB0ZW1wTGV2ZWwpe1xuICAgICAgICAgICAgICAgIHpvb21Ub29sLnpvb21PdXQoKHRlbXBMZXZlbCAtIHpvb21MZXZlbCkgKiBqdW1wcyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGVtcExldmVsID0gem9vbUxldmVsO1xuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudExldmVsICogbGV2ZWxWYWx1ZSArICclJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBzY29wZS56b29tSW4gPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYoem9vbUxldmVsIDwgbWF4TGV2ZWwpe1xuICAgICAgICAgICAgICB6b29tTGV2ZWwrKztcbiAgICAgICAgICAgICAgY3VycmVudExldmVsLS07XG4gICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRQb2ludGVySGVpZ2h0ICsgJyUnKTtcbiAgICAgICAgICAgICAgem9vbVRvb2wuem9vbUluKGp1bXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgc2NvcGUuem9vbU91dCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZih6b29tTGV2ZWwgPiBtaW5MZXZlbCl7XG4gICAgICAgICAgICAgIHpvb21MZXZlbC0tO1xuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwrKztcbiAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlO1xuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudFBvaW50ZXJIZWlnaHQgKyAnJScpO1xuICAgICAgICAgICAgICB6b29tVG9vbC56b29tT3V0KGp1bXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbn0od2luZG93LmFuZ3VsYXIpKTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDA1LzAyLzE1LlxuICovXG5cbihmdW5jdGlvbihhbmd1bGFyKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdab29tQXJlYVRvb2wnLCBbJ1Rvb2wnLCAnQ2VzaXVtJyxcbiAgICBmdW5jdGlvbihUb29sLCBDZXNpdW0pe1xuXG4gICAgICBsZXQgX21hcCA9IFN5bWJvbCgnX21hcCcpO1xuICAgICAgbGV0IF9hY3RpdmUgPSBTeW1ib2woJ19hY3RpdmUnKTtcbiAgICAgIGxldCBfZW5zdXJlRmx5ID0gU3ltYm9sKCdfZW5zdXJlRmx5Jyk7XG4gICAgICBsZXQgX21hcENvbnRhaW5lciA9IFN5bWJvbCgnX21hcENvbnRhaW5lcicpO1xuICAgICAgbGV0IF9tYXBFdmVudHNIYW5kbGVyID0gU3ltYm9sKCdfbWFwRXZlbnRzSGFuZGxlcicpO1xuICAgICAgbGV0IF9tYXBDb250YWluZXJNb3VzZURvd25IYW5kbGVyID0gU3ltYm9sKCdfbWFwQ29udGFpbmVyTW91c2VEb3duSGFuZGxlcicpO1xuICAgICAgbGV0IF9tYXBDb250YWluZXJNb3VzZU1vdmVIYW5kbGVyID0gU3ltYm9sKCdfbWFwQ29udGFpbmVyTW91c2VNb3ZlSGFuZGxlcicpO1xuICAgICAgbGV0IF9tYXBDb250YWluZXJNb3VzZVVwSGFuZGxlciA9IFN5bWJvbCgnX21hcENvbnRhaW5lck1vdXNlVXBIYW5kbGVyJyk7XG4gICAgICBsZXQgX21hcENvbnRhaW5lck1vdXNlTGVhdmUgPSBTeW1ib2woJ19tYXBDb250YWluZXJNb3VzZUxlYXZlJyk7XG4gICAgICBsZXQgX2Nlc2l1bVdpZGdldE1vdXNlRG93bkhhbmRsZXIgPSBTeW1ib2woJ19jZXNpdW1XaWRnZXRNb3VzZURvd25IYW5kbGVyJyk7XG4gICAgICBsZXQgX2Nlc2l1bVdpZGdldE1vdXNlVXBIYW5kbGVyID0gU3ltYm9sKCdfY2VzaXVtV2lkZ2V0TW91c2VVcEhhbmRsZXInKTtcbiAgICAgIGxldCBfaW5pdE1hcENvbnRhaW5lck1vdXNlSGFuZGxlcnMgPSBTeW1ib2woJ19pbml0TWFwQ29udGFpbmVyTW91c2VIYW5kbGVycycpO1xuICAgICAgbGV0IF9iaW5kTWFwQ29udGFpbmVyTW91c2VIYW5kbGVycyA9IFN5bWJvbCgnX2JpbmRNYXBDb250YWluZXJNb3VzZUhhbmRsZXJzJyk7XG4gICAgICBsZXQgX3VuYmluZE1hcENvbnRhaW5lck1vdXNlSGFuZGxlcnMgPSBTeW1ib2woJ191bmJpbmRNYXBDb250YWluZXJNb3VzZUhhbmRsZXJzJyk7XG4gICAgICBsZXQgX2luaXRDZXNpdW1XaWRnZXRNb3VzZUhhbmRsZXJzID0gU3ltYm9sKCdfaW5pdENlc2l1bVdpZGdldE1vdXNlSGFuZGxlcnMnKTtcbiAgICAgIGxldCBfYmluZENlc2l1bVdpZGdldE1vdXNlSGFuZGxlcnMgPSBTeW1ib2woJ19iaW5kQ2VzaXVtV2lkZ2V0TW91c2VIYW5kbGVycycpO1xuICAgICAgbGV0IF91bmJpbmRDZXNpdW1XaWRnZXRNb3VzZUhhbmRsZXJzID0gU3ltYm9sKCdfdW5iaW5kQ2VzaXVtV2lkZ2V0TW91c2VIYW5kbGVycycpO1xuXG4gICAgICBjbGFzcyBab29tQXJlYVRvb2wgZXh0ZW5kcyBUb29sIHtcbiAgICAgICAgY29uc3RydWN0b3IobWFwKXtcbiAgICAgICAgICB0aGlzW19tYXBdID0gbWFwO1xuICAgICAgICAgIHRoaXNbX2FjdGl2ZV0gPSBmYWxzZTtcbiAgICAgICAgICB0aGlzW19lbnN1cmVGbHldID0gZmFsc2U7XG5cbiAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJdID0gYW5ndWxhci5lbGVtZW50KG1hcC5jYW52YXMucGFyZW50Tm9kZSk7XG4gICAgICAgICAgdGhpc1tfbWFwRXZlbnRzSGFuZGxlcl0gPSBuZXcgQ2VzaXVtLlNjcmVlblNwYWNlRXZlbnRIYW5kbGVyKG1hcC5jYW52YXMpO1xuXG4gICAgICAgICAgdGhpc1tfbWFwQ29udGFpbmVyTW91c2VEb3duSGFuZGxlcl0gPSBudWxsO1xuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lck1vdXNlTW92ZUhhbmRsZXJdID0gbnVsbDtcbiAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJNb3VzZVVwSGFuZGxlcl0gPSBudWxsO1xuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lck1vdXNlTGVhdmVdID0gbnVsbDtcblxuICAgICAgICAgIHRoaXNbX2Nlc2l1bVdpZGdldE1vdXNlRG93bkhhbmRsZXJdID0gbnVsbDtcbiAgICAgICAgICB0aGlzW19jZXNpdW1XaWRnZXRNb3VzZVVwSGFuZGxlcl0gPSBudWxsO1xuXG4gICAgICAgICAgdGhpc1tfaW5pdE1hcENvbnRhaW5lck1vdXNlSGFuZGxlcnNdKCk7XG4gICAgICAgICAgdGhpc1tfaW5pdENlc2l1bVdpZGdldE1vdXNlSGFuZGxlcnNdKCk7XG4gICAgICAgIH1cblxuICAgICAgICBbX2luaXRNYXBDb250YWluZXJNb3VzZUhhbmRsZXJzXSgpe1xuICAgICAgICAgIGxldCBwYWdlWCA9IDA7XG4gICAgICAgICAgbGV0IHBhZ2VZID0gMDtcbiAgICAgICAgICBsZXQgc3RhcnRYID0gMDtcbiAgICAgICAgICBsZXQgc3RhcnRZID0gMDtcbiAgICAgICAgICBsZXQgZGVsdGFYID0gMDtcbiAgICAgICAgICBsZXQgZGVsdGFZID0gMDtcbiAgICAgICAgICBsZXQgc2VsZWN0ZWRTdGFydCA9IGZhbHNlO1xuXG4gICAgICAgICAgbGV0IHNlbGVjdG9yID0gYW5ndWxhci5lbGVtZW50KCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICAgIHNlbGVjdG9yLmNzcygnYm9yZGVyJywgJzJweCBkYXNoZWQgd2hpdGUnKTtcblxuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lck1vdXNlRG93bkhhbmRsZXJdID0gZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYoIXRoaXNbX2FjdGl2ZV0pe1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhZ2VYID0gZXZlbnQucGFnZVg7XG4gICAgICAgICAgICBwYWdlWSA9IGV2ZW50LnBhZ2VZO1xuICAgICAgICAgICAgc3RhcnRYID0gZXZlbnQub2Zmc2V0WDtcbiAgICAgICAgICAgIHN0YXJ0WSA9IGV2ZW50Lm9mZnNldFk7XG4gICAgICAgICAgICB0aGlzW19lbnN1cmVGbHldID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJdLmNzcygnY3Vyc29yJywgJ3pvb20taW4nKTtcblxuICAgICAgICAgICAgc2VsZWN0b3IuY3NzKHtcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgIHRvcDogYCR7c3RhcnRZfXB4YCxcbiAgICAgICAgICAgICAgbGVmdDogYCR7c3RhcnRYfXB4YCxcbiAgICAgICAgICAgICAgd2lkdGg6ICcwcHgnLFxuICAgICAgICAgICAgICBoZWlnaHQ6ICcwcHgnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpc1tfbWFwQ29udGFpbmVyXS5hcHBlbmQoc2VsZWN0b3IpO1xuICAgICAgICAgICAgc2VsZWN0ZWRTdGFydCA9IHRydWU7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lck1vdXNlTW92ZUhhbmRsZXJdID0gZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYoIXRoaXNbX2FjdGl2ZV0gfHwgIXNlbGVjdGVkU3RhcnQpe1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbHRhWCA9ICBldmVudC5wYWdlWCAtIHBhZ2VYO1xuICAgICAgICAgICAgZGVsdGFZID0gZXZlbnQucGFnZVkgLSBwYWdlWTtcblxuICAgICAgICAgICAgbGV0IHNlbGVjdG9yU3R5bGUgPSB7fTtcblxuICAgICAgICAgICAgaWYoZGVsdGFYID4gMCl7XG4gICAgICAgICAgICAgIHNlbGVjdG9yU3R5bGUud2lkdGggPSBgJHtkZWx0YVh9cHhgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGVsdGFYIDwgMCl7XG4gICAgICAgICAgICAgIGRlbHRhWCA9IE1hdGguYWJzKGRlbHRhWCk7XG4gICAgICAgICAgICAgIHNlbGVjdG9yU3R5bGUud2lkdGggPSBgJHtkZWx0YVh9cHhgO1xuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLmxlZnQgPSBgJHtzdGFydFggLSBkZWx0YVh9cHhgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGVsdGFZID4gMCl7XG4gICAgICAgICAgICAgIHNlbGVjdG9yU3R5bGUuaGVpZ2h0ID0gYCR7ZGVsdGFZfXB4YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRlbHRhWSA8IDApe1xuICAgICAgICAgICAgICBkZWx0YVkgPSBNYXRoLmFicyhkZWx0YVkpO1xuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLmhlaWdodCA9IGAke2RlbHRhWX1weGA7XG4gICAgICAgICAgICAgIHNlbGVjdG9yU3R5bGUudG9wID0gYCR7c3RhcnRZIC0gZGVsdGFZfXB4YDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZWN0b3IuY3NzKHNlbGVjdG9yU3R5bGUpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJNb3VzZVVwSGFuZGxlcl0gPSBldmVudCA9PiB7XG4gICAgICAgICAgICBpZighdGhpc1tfYWN0aXZlXSl7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZWN0ZWRTdGFydCA9IGZhbHNlO1xuICAgICAgICAgICAgc2VsZWN0b3IucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJdLmNzcygnY3Vyc29yJywgJycpO1xuICAgICAgICAgICAgdGhpc1tfZW5zdXJlRmx5XSA9IHRydWU7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lck1vdXNlTGVhdmVdID0gZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYoIXRoaXNbX2FjdGl2ZV0pe1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lcl0uY3NzKCdjdXJzb3InLCAnJyk7XG4gICAgICAgICAgICBzZWxlY3Rvci5yZW1vdmUoKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgW19iaW5kTWFwQ29udGFpbmVyTW91c2VIYW5kbGVyc10oKXtcbiAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJdLm9uKCdtb3VzZWRvd24nLCB0aGlzW19tYXBDb250YWluZXJNb3VzZURvd25IYW5kbGVyXSk7XG4gICAgICAgICAgdGhpc1tfbWFwQ29udGFpbmVyXS5vbignbW91c2Vtb3ZlJywgdGhpc1tfbWFwQ29udGFpbmVyTW91c2VNb3ZlSGFuZGxlcl0pO1xuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lcl0ub24oJ21vdXNldXAnLCB0aGlzW19tYXBDb250YWluZXJNb3VzZVVwSGFuZGxlcl0pO1xuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lcl0ub24oJ21vdXNlbGVhdmUnLCB0aGlzW19tYXBDb250YWluZXJNb3VzZUxlYXZlXSk7XG4gICAgICAgIH1cblxuICAgICAgICBbX3VuYmluZE1hcENvbnRhaW5lck1vdXNlSGFuZGxlcnNdKCl7XG4gICAgICAgICAgdGhpc1tfbWFwQ29udGFpbmVyXS5vZmYoJ21vdXNlZG93bicsIHRoaXNbX21hcENvbnRhaW5lck1vdXNlRG93bkhhbmRsZXJdKTtcbiAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJdLm9mZignbW91c2Vtb3ZlJywgdGhpc1tfbWFwQ29udGFpbmVyTW91c2VNb3ZlSGFuZGxlcl0pO1xuICAgICAgICAgIHRoaXNbX21hcENvbnRhaW5lcl0ub2ZmKCdtb3VzZXVwJywgdGhpc1tfbWFwQ29udGFpbmVyTW91c2VVcEhhbmRsZXJdKTtcbiAgICAgICAgICB0aGlzW19tYXBDb250YWluZXJdLm9mZignbW91c2VsZWF2ZScsIHRoaXNbX21hcENvbnRhaW5lck1vdXNlTGVhdmVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFtfaW5pdENlc2l1bVdpZGdldE1vdXNlSGFuZGxlcnNdKCl7XG4gICAgICAgICAgbGV0IHN0YXJ0UG9zaXRpb24gPSBudWxsO1xuICAgICAgICAgIGxldCBlbmRQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgbGV0IGNhbWVyYSA9IHRoaXNbX21hcF0uc2NlbmUuY2FtZXJhO1xuICAgICAgICAgIGxldCBlbGxpcHNvaWQgPSB0aGlzW19tYXBdLnNjZW5lLmdsb2JlLmVsbGlwc29pZDtcblxuICAgICAgICAgIHRoaXNbX2Nlc2l1bVdpZGdldE1vdXNlRG93bkhhbmRsZXJdID0gbW92ZW1lbnQgPT4ge1xuICAgICAgICAgICAgaWYoIXRoaXNbX2FjdGl2ZV0pe1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBjYXJ0ZXNpYW4gPSBjYW1lcmEucGlja0VsbGlwc29pZChtb3ZlbWVudC5wb3NpdGlvbik7XG5cbiAgICAgICAgICAgIGlmKGNhcnRlc2lhbil7XG4gICAgICAgICAgICAgIGxldCBjYXJ0b2dyYXBoaWMgPSBlbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWMoY2FydGVzaWFuKTtcbiAgICAgICAgICAgICAgc3RhcnRQb3NpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBsb246IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubG9uZ2l0dWRlKSxcbiAgICAgICAgICAgICAgICBsYXQ6IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubGF0aXR1ZGUpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgc3RhcnRQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXNbX2Nlc2l1bVdpZGdldE1vdXNlVXBIYW5kbGVyXSA9IG1vdmVtZW50ID0+ICB7XG4gICAgICAgICAgICBpZighdGhpc1tfYWN0aXZlXSl7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNhcnRlc2lhbiA9IGNhbWVyYS5waWNrRWxsaXBzb2lkKG1vdmVtZW50LnBvc2l0aW9uKTtcblxuICAgICAgICAgICAgaWYoY2FydGVzaWFuKXtcbiAgICAgICAgICAgICAgbGV0IGNhcnRvZ3JhcGhpYyA9IGVsbGlwc29pZC5jYXJ0ZXNpYW5Ub0NhcnRvZ3JhcGhpYyhjYXJ0ZXNpYW4pO1xuICAgICAgICAgICAgICBlbmRQb3NpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBsb246IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubG9uZ2l0dWRlKSxcbiAgICAgICAgICAgICAgICBsYXQ6IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubGF0aXR1ZGUpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgZW5kUG9zaXRpb24gPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0aGlzW19lbnN1cmVGbHldICYmIHN0YXJ0UG9zaXRpb24gIT09IG51bGwgJiYgZW5kUG9zaXRpb24gIT0gbnVsbCl7XG4gICAgICAgICAgICAgIHRoaXNbX2Vuc3VyZUZseV0gPSBmYWxzZTtcblxuICAgICAgICAgICAgICBsZXQgcmVjdGFuZ2xlID0gQ2VzaXVtLlJlY3RhbmdsZS5mcm9tRGVncmVlcyhcbiAgICAgICAgICAgICAgICBzdGFydFBvc2l0aW9uLmxvbiwgc3RhcnRQb3NpdGlvbi5sYXQsIGVuZFBvc2l0aW9uLmxvbiwgZW5kUG9zaXRpb24ubGF0XG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgY2FtZXJhLmZseVRvUmVjdGFuZ2xlKHtcbiAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbjogcmVjdGFuZ2xlXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBbX2JpbmRDZXNpdW1XaWRnZXRNb3VzZUhhbmRsZXJzXSgpe1xuICAgICAgICAgIHRoaXNbX21hcEV2ZW50c0hhbmRsZXJdLnNldElucHV0QWN0aW9uKHRoaXNbX2Nlc2l1bVdpZGdldE1vdXNlRG93bkhhbmRsZXJdLCBDZXNpdW0uU2NyZWVuU3BhY2VFdmVudFR5cGUuTEVGVF9ET1dOKTtcbiAgICAgICAgICB0aGlzW19tYXBFdmVudHNIYW5kbGVyXS5zZXRJbnB1dEFjdGlvbih0aGlzW19jZXNpdW1XaWRnZXRNb3VzZVVwSGFuZGxlcl0sIENlc2l1bS5TY3JlZW5TcGFjZUV2ZW50VHlwZS5MRUZUX1VQKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFtfdW5iaW5kQ2VzaXVtV2lkZ2V0TW91c2VIYW5kbGVyc10oKXtcbiAgICAgICAgICB0aGlzW19tYXBFdmVudHNIYW5kbGVyXS5yZW1vdmVJbnB1dEFjdGlvbihDZXNpdW0uU2NyZWVuU3BhY2VFdmVudFR5cGUuTEVGVF9ET1dOKTtcbiAgICAgICAgICB0aGlzW19tYXBFdmVudHNIYW5kbGVyXS5yZW1vdmVJbnB1dEFjdGlvbihDZXNpdW0uU2NyZWVuU3BhY2VFdmVudFR5cGUuTEVGVF9VUCk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGFydCgpe1xuICAgICAgICAgIHRoaXNbX21hcF0uc2NlbmUuc2NyZWVuU3BhY2VDYW1lcmFDb250cm9sbGVyLmVuYWJsZVJvdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgIHRoaXNbX2Vuc3VyZUZseV0gPSBmYWxzZTtcbiAgICAgICAgICB0aGlzW19iaW5kQ2VzaXVtV2lkZ2V0TW91c2VIYW5kbGVyc10oKTtcbiAgICAgICAgICB0aGlzW19iaW5kTWFwQ29udGFpbmVyTW91c2VIYW5kbGVyc10oKTtcbiAgICAgICAgICB0aGlzW19hY3RpdmVdID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0b3AoKXtcbiAgICAgICAgICB0aGlzW19hY3RpdmVdID0gZmFsc2U7XG4gICAgICAgICAgdGhpc1tfbWFwXS5zY2VuZS5zY3JlZW5TcGFjZUNhbWVyYUNvbnRyb2xsZXIuZW5hYmxlUm90YXRlID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzW191bmJpbmRNYXBDb250YWluZXJNb3VzZUhhbmRsZXJzXSgpO1xuICAgICAgICAgIHRoaXNbX3VuYmluZENlc2l1bVdpZGdldE1vdXNlSGFuZGxlcnNdKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0b2dnbGUoKXtcbiAgICAgICAgICBpZih0aGlzW19hY3RpdmVdKXtcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gWm9vbUFyZWFUb29sO1xuICAgIH1cbiAgXSk7XG5cbn0od2luZG93LmFuZ3VsYXIpKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==