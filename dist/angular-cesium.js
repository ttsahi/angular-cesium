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
      require: '^toolbar',
      transclude: true,
      template: '<div style="margin-bottom: 15px;"></div>',
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
"use strict";
(function(angular) {
  'use strict';
  angular.module('angularCesium').factory('ZoomAreaTool', ['Tool', 'Cesium', function(Tool, Cesium) {
    var $__2;
    var _map = Symbol('_map');
    var _ensureFly = Symbol('_ensureFly');
    var _initMapMouseHandlers = Symbol('_initMapMouseHandlers');
    var _removeMapMouseHandlers = Symbol('_removeMapMouseHandlers');
    var _initCesiumMouseHandlers = Symbol('_initCesiumMouseHandlers');
    var _removeCesiumMouseHandlers = Symbol('_removeCesiumMouseHandlers');
    var ZoomAreaTool = function ZoomAreaTool(map) {
      this[_map] = map;
      this[_ensureFly] = false;
    };
    ($traceurRuntime.createClass)(ZoomAreaTool, ($__2 = {}, Object.defineProperty($__2, _initMapMouseHandlers, {
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
        var mapContainer = angular.element(this[_map].canvas.parentNode);
        selector.css('border', '2px dashed white');
        mapContainer.on('mousedown', (function(event) {
          pageX = event.pageX;
          pageY = event.pageY;
          startX = event.offsetX;
          startY = event.offsetY;
          $__0[_ensureFly] = false;
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
          $__0[_ensureFly] = true;
        }));
        mapContainer.on('mouseleave', (function(event) {
          selectedStart = false;
          mapContainer.css('cursor', '');
          selector.remove();
        }));
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _removeMapMouseHandlers, {
      value: function() {
        var mapContainer = angular.element(this[_map].canvas.parentNode);
        mapContainer.unbind('mousedown');
        mapContainer.unbind('mousemove');
        mapContainer.unbind('mouseup');
        mapContainer.unbind('mouseleave');
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _initCesiumMouseHandlers, {
      value: function() {
        var $__0 = this;
        var startPosition = null;
        var endPosition = null;
        var camera = this[_map].scene.camera;
        var ellipsoid = this[_map].scene.globe.ellipsoid;
        var handler = new Cesium.ScreenSpaceEventHandler(this[_map].canvas);
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
          if ($__0[_ensureFly] && startPosition !== null && endPosition != null) {
            $__0[_ensureFly] = false;
            var rectangle = Cesium.Rectangle.fromDegrees(startPosition.lon, startPosition.lat, endPosition.lon, endPosition.lat);
            camera.flyToRectangle({destination: rectangle});
          }
        }), Cesium.ScreenSpaceEventType.LEFT_UP);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, _removeCesiumMouseHandlers, {
      value: function() {
        var handler = new Cesium.ScreenSpaceEventHandler(this[_map].canvas);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, "start", {
      value: function() {
        this[_map].scene.screenSpaceCameraController.enableRotate = false;
        this[_ensureFly] = false;
        this[_initCesiumMouseHandlers]();
        this[_initMapMouseHandlers]();
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, "stop", {
      value: function() {
        this[_map].scene.screenSpaceCameraController.enableRotate = true;
        this[_removeCesiumMouseHandlers]();
        this[_removeMapMouseHandlers]();
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__2), {}, Tool);
    return ZoomAreaTool;
  }]);
}(window.angular));
//# sourceURL=map-components/tools/zoom-area/zoom-area-tool.js
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Byb3h5LmpzIiwic2VydmljZXMvdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL2JpbGxib2FyZC9iaWxsYm9hcmQuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmRzLWxheWVyL2JpbGxib2FyZHMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9jb21wbGV4LWxheWVyL2NvbXBsZXgtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9sYWJlbHMtbGF5ZXIvbGFiZWxzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmUvcG9seWxpbmUuanMiLCJtYXAtY29tcG9uZW50cy9tYXAvbWFwLWRpcmVjdGl2ZS5qcyIsIm1hcC1jb21wb25lbnRzL2xhYmVsL2xhYmVsLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmVzLWxheWVyL3BvbHlsaW5lcy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC1iYXIuZHJ2LmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbC90b29sLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xiYXIvZHJhZ2dhYmxlLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbGJhci90b29sYmFyLmpzIiwibWFwLWNvbXBvbmVudHMvd2ViLW1hcC1zZXJ2aWNlLWxheWVyL3dlYi1tYXAtc2VydmljZS1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS10b29sLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbHMvem9vbS96b29tLXdpZGdldC5kcnYuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tLWFyZWEvem9vbS1hcmVhLXRvb2wuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFuZ3VsYXItY2VzaXVtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJywgWydvYnNlcnZhYmxlQ29sbGVjdGlvbiddKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5zZXJ2aWNlKCdCaWxsQm9hcmRBdHRyaWJ1dGVzJywgZnVuY3Rpb24oJHBhcnNlKSB7XHJcbiAgdGhpcy5jYWxjQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGF0dHJzLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBpbWFnZSA6ICRwYXJzZShhdHRycy5pbWFnZSkoY29udGV4dClcclxuICAgIH07XHJcbiAgICB2YXIgcG9zaXRpb25BdHRyID0gJHBhcnNlKGF0dHJzLnBvc2l0aW9uKShjb250ZXh0KTtcclxuICAgIHJlc3VsdC5wb3NpdGlvbiA9IENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbkF0dHIubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb25BdHRyLmFsdGl0dWRlKSB8fCAwKTtcclxuXHJcbiAgICB2YXIgY29sb3IgPSAkcGFyc2UoYXR0cnMuY29sb3IpKGNvbnRleHQpO1xyXG4gICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgIHJlc3VsdC5jb2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoY29sb3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnQ2VzaXVtJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIENlc2l1bTtcclxufSk7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDA5LzAyLzE1LlxuICovXG5cbihmdW5jdGlvbihhbmd1bGFyKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdQcm94eScsIFtcbiAgICBmdW5jdGlvbigpe1xuXG4gICAgICBmdW5jdGlvbiBQcm94eSh0YXJnZXQsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYodGFyZ2V0ID09PSBudWxsIHx8ICh0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKSl7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRhcmdldCBtdXN0IGJlIG9iamVjdCBvciBmdW5jdGlvbi5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZihoYW5kbGVyID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYoaGFuZGxlciA9PT0gbnVsbCB8fCB0eXBlb2YgaGFuZGxlciAhPT0gJ29iamVjdCcpe1xuICAgICAgICAgIHRocm93ICBuZXcgVHlwZUVycm9yKFwiSGFuZGxlciBtdXQgYmUgb2JqZWN0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJyl7XG5cbiAgICAgICAgICBpZih0eXBlb2YgaGFuZGxlci5hcHBseSAhPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpeyByZXR1cm4gaGFuZGxlci5hcHBseSh0YXJnZXQsIHRoaXMsIGFyZ3MpIH07XG5cbiAgICAgICAgfWVsc2V7XG5cbiAgICAgICAgICBpZih0eXBlb2YgaGFuZGxlci5nZXQgIT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGhhbmRsZXIuc2V0ICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IobGV0IHByb3AgaW4gdGFyZ2V0KXtcblxuICAgICAgICAgICAgbGV0IHByb3h5ID0ge307XG5cbiAgICAgICAgICAgIGlmKGhhbmRsZXIuZ2V0ICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICBwcm94eS5nZXQgPSAoKSA9PiBoYW5kbGVyLmdldCh0YXJnZXQsIHByb3ApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihoYW5kbGVyLnNldCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgcHJveHkuc2V0ID0gdmFsID0+IHsgaGFuZGxlci5zZXQodGFyZ2V0LCBwcm9wLCB2YWwpOyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBwcm9wLCBwcm94eSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm94eTtcbiAgICB9XG4gIF0pO1xuXG59KHdpbmRvdy5hbmd1bGFyKSk7XG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAxLzAyLzE1LlxyXG4gKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ1Rvb2wnLCBbXHJcbiAgICBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgY2xhc3MgVG9vbCB7XHJcbiAgICAgICAgc3RhcnQoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiOyB9XHJcbiAgICAgICAgc3RvcCgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7IH1cclxuICAgICAgICBjYW5jZWwoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cclxuICAgICAgICBvblVwZGF0ZSgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7fVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gVG9vbDtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdiaWxsYm9hcmQnLCBmdW5jdGlvbihCaWxsQm9hcmRBdHRyaWJ1dGVzKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdeYmlsbGJvYXJkc0xheWVyJyxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGJpbGxib2FyZHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgc2NvcGUpO1xyXG5cclxuICAgICAgdmFyIGJpbGxib2FyZCA9IGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLmFkZChiaWxsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgYmlsbGJvYXJkc0xheWVyQ3RybC5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uKCkucmVtb3ZlKGJpbGxib2FyZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkc0xheWVyJywgZnVuY3Rpb24oJHBhcnNlLCBPYnNlcnZhYmxlQ29sbGVjdGlvbiwgQmlsbEJvYXJkQXR0cmlidXRlcywgQ2VzaXVtKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUsICRhdHRycykge1xyXG4gICAgICB0aGlzLmdldEJpbGxib2FyZENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoJGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBnZXQgY29sbGVjdGlvbiBpZiBsYXllciBpcyBib3VuZCB0byBPYnNlcnZhYmxlQ29sbGVjdGlvbicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uQmlsbGJvYXJkQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgdmFyIENPTExFQ1RJT05fUkVHRVhQID0gL1xccyooW1xcJFxcd11bXFwkXFx3XSopXFxzK2luXFxzKyhbXFwkXFx3XVtcXCRcXHddKikvO1xyXG4gICAgICAgICAgdmFyIG1hdGNoID0gYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24ubWF0Y2goQ09MTEVDVElPTl9SRUdFWFApO1xyXG4gICAgICAgICAgdmFyIGl0ZW1OYW1lID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICB2YXIgY29sbGVjdGlvbiA9ICRwYXJzZShtYXRjaFsyXSkoc2NvcGUpO1xyXG4gICAgICAgICAgaWYgKCFjb2xsZWN0aW9uIGluc3RhbmNlb2YgT2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvYnNlcnZhYmxlLWNvbGxlY3Rpb24gbXVzdCBiZSBvZiB0eXBlIE9ic2VydmFibGVDb2xsZWN0aW9uLicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhZGRCaWxsYm9hcmQgPSBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICAgICAgICBjb250ZXh0W2l0ZW1OYW1lXSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24uYWRkKGJpbGxEZXNjKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb2xsZWN0aW9uLmdldERhdGEoKSwgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgIGFkZEJpbGxib2FyZChpdGVtKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vbkFkZChhZGRCaWxsYm9hcmQpO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uVXBkYXRlKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vblJlbW92ZShmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24ucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24uZ2V0KGluZGV4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDE3LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2NvbXBsZXhMYXllcicsIGZ1bmN0aW9uKCRsb2cpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29tcGlsZSA6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50LmNoaWxkcmVuKCksIGZ1bmN0aW9uIChjaGlsZCkge1xyXG5cclxuICAgICAgICAgIHZhciBsYXllciA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICBpZiAoY2hpbGQudGFnTmFtZSA9PT0gJ0JJTExCT0FSRCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxiaWxsYm9hcmRzLWxheWVyPjwvYmlsbGJvYXJkcy1sYXllcj4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLnRhZ05hbWUgPT09ICdMQUJFTCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxsYWJlbHMtbGF5ZXI+PC9sYWJlbHMtbGF5ZXI+Jyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXllcikge1xyXG4gICAgICAgICAgICAkbG9nLndhcm4oJ0ZvdW5kIGFuIHVua25vd24gY2hpbGQgb2Ygb2YgY29tcGxleC1sYXllci4gUmVtb3ZpbmcuLi4nKTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGNoaWxkKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY2hpbGQuYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcclxuICAgICAgICAgICAgICBsYXllci5hdHRyKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudFswXS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG4gICAgICAgICAgICAgIGlmICghYW5ndWxhci5lbGVtZW50KGNoaWxkKS5hdHRyKGF0dHIubmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGxheWVyLmF0dHIoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLnJlcGxhY2VXaXRoKGxheWVyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdsYWJlbHNMYXllcicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBzY29wZSA6IHt9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldExhYmVsQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY29sbGVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICAgIHNjb3BlLmNvbGxlY3Rpb24gPSBuZXcgQ2VzaXVtLkxhYmVsQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5hZGQoc2NvcGUuY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ2lsbmlzMiBvbiAxOC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdwb2x5bGluZScsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXnBvbHlsaW5lc0xheWVyJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBjb2xvciA6ICcmJyxcclxuICAgICAgd2lkdGggOiAnJicsXHJcbiAgICAgIHBvc2l0aW9ucyA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBvbHlsaW5lc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgcG9seWxpbmVEZXNjID0ge307XHJcblxyXG4gICAgICBpZiAoIWFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLnBvc2l0aW9ucykgfHwgIWFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS5wb3NpdGlvbnMpKXtcclxuICAgICAgICB0aHJvdyBcIlBvbHlsaW5lIHBvc2l0aW9ucyBtdXN0IGJlIGRlZmluZWQgYXMgYSBmdW5jdGlvblwiO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBwb3NpdGlvbnMgPSBzY29wZS5wb3NpdGlvbnMoKTtcclxuICAgICAgcG9seWxpbmVEZXNjLnBvc2l0aW9ucyA9IFtdO1xyXG4gICAgICBhbmd1bGFyLmZvckVhY2gocG9zaXRpb25zLCBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gICAgICAgIHBvbHlsaW5lRGVzYy5wb3NpdGlvbnMucHVzaChDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCkpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBjZXNpdW1Db2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoJ2JsYWNrJyk7XHJcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChzY29wZS5jb2xvcikgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLmNvbG9yKSl7XHJcbiAgICAgICAgY2VzaXVtQ29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKHNjb3BlLmNvbG9yKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgcG9seWxpbmVEZXNjLm1hdGVyaWFsID0gQ2VzaXVtLk1hdGVyaWFsLmZyb21UeXBlKCdDb2xvcicpO1xyXG4gICAgICBwb2x5bGluZURlc2MubWF0ZXJpYWwudW5pZm9ybXMuY29sb3IgPSBjZXNpdW1Db2xvcjtcclxuXHJcbiAgICAgIHBvbHlsaW5lRGVzYy53aWR0aCA9IDE7XHJcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChzY29wZS53aWR0aCkgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLndpZHRoKSl7XHJcbiAgICAgICAgcG9seWxpbmVEZXNjLndpZHRoID0gc2NvcGUud2lkdGgoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBvbHlsaW5lID0gcG9seWxpbmVzTGF5ZXJDdHJsLmdldFBvbHlsaW5lQ29sbGVjdGlvbigpLmFkZChwb2x5bGluZURlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHBvbHlsaW5lc0xheWVyQ3RybC5nZXRQb2x5bGluZUNvbGxlY3Rpb24oKS5yZW1vdmUocG9seWxpbmUpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ21hcCcsIGZ1bmN0aW9uKCkge1xyXG4gIGZ1bmN0aW9uIGdldFNjZW5lTW9kZShkaW1lbnNpb25zKSB7XHJcbiAgICBpZiAoZGltZW5zaW9ucyA9PSAyKSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FMkQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChkaW1lbnNpb25zID09IDIuNSkge1xyXG4gICAgICByZXR1cm4gQ2VzaXVtLlNjZW5lTW9kZS5DT0xVTUJVU19WSUVXO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FM0Q7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdj4gPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPiA8ZGl2IGNsYXNzPVwibWFwLWNvbnRhaW5lclwiPjwvZGl2PiA8L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgZGltZW5zaW9ucyA6ICdAJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNlc2l1bTtcclxuICAgICAgfTtcclxuICAgICAgJHNjb3BlLm9uRHJvcCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAoIXNjb3BlLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICAgIHNjb3BlLmRpbWVuc2lvbnMgPSAzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NvcGUuY2VzaXVtID0gbmV3IENlc2l1bS5DZXNpdW1XaWRnZXQoZWxlbWVudC5maW5kKCdkaXYnKVswXSwge1xyXG4gICAgICAgICAgc2NlbmVNb2RlOiBnZXRTY2VuZU1vZGUoc2NvcGUuZGltZW5zaW9ucylcclxuICAgICAgICB9KTtcclxuICAgICAgICBzY29wZS5tYXBSZWN0ID0gZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebGFiZWxzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB0ZXh0IDogJyYnLFxyXG4gICAgICBwb3NpdGlvbiA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGxhYmVsc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgbGFiZWxEZXNjID0ge307XHJcblxyXG4gICAgICB2YXIgcG9zaXRpb24gPSBzY29wZS5wb3NpdGlvbigpO1xyXG4gICAgICBsYWJlbERlc2MucG9zaXRpb24gPSBDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCk7XHJcblxyXG4gICAgICB2YXIgY29sb3IgPSBzY29wZS5jb2xvcigpO1xyXG4gICAgICBpZiAoY29sb3IpIHtcclxuICAgICAgICBsYWJlbERlc2MuY29sb3IgPSBjb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGFiZWxEZXNjLnRleHQgPSBzY29wZS50ZXh0KCk7XHJcblxyXG4gICAgICB2YXIgbGFiZWwgPSBsYWJlbHNMYXllckN0cmwuZ2V0TGFiZWxDb2xsZWN0aW9uKCkuYWRkKGxhYmVsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLnJlbW92ZShsYWJlbCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmVzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRQb2x5bGluZUNvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5Qb2x5bGluZUNvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sQmFyJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXF1aXJlOiAnXm1hcCcsXHJcbiAgICAgICAgLy90cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgIC8vdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU9XCJcIj48L2Rpdj4nLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJyxcclxuICAgICAgICAgIGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbGluazoge1xyXG4gICAgICAgICAgcHJlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpe1xyXG4gICAgICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAxLzAyLzE1LlxuICovXG5cbihmdW5jdGlvbihhbmd1bGFyKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2wnLCBbJ1Rvb2wnLCAnUHJveHknLFxuICAgIGZ1bmN0aW9uKFRvb2wsIFByb3h5KXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlcXVpcmU6ICdedG9vbGJhcicsXG4gICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDE1cHg7XCI+PC9kaXY+JyxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICB0eXBlOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLFxuICAgICAgICAgIGZ1bmN0aW9uKCRzY29wZSl7XG4gICAgICAgICAgICB0aGlzLmdldFRvb2wgPSAoKSA9PiAkc2NvcGUudG9vbDtcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgdG9vbEJhckN0cmwsIGxpbmtlcil7XG4gICAgICAgICAgaWYoISh0eXBlb2Ygc2NvcGUudHlwZSA9PT0gJ2Z1bmN0aW9uJykpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInR5cGUgYXR0ciBtdXN0IGJlIGNvbnN0cnVjdG9yLlwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdG9vbCA9IG5ldyBzY29wZS50eXBlKHRvb2xCYXJDdHJsLmdldENlc2l1bVdpZGdldCgpKTtcblxuICAgICAgICAgIGlmKCEodG9vbCBpbnN0YW5jZW9mIFRvb2wpKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0b29sIG11c3QgYmUgaW5zdGFuY2Ugb2YgVG9vbC5cIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9vbC5zdGFydCA9IFByb3h5KHRvb2wuc3RhcnQsIHtcbiAgICAgICAgICAgIGFwcGx5OiAodGFyZ2V0LCBjb250ZXh0KSA9PiB0b29sQmFyQ3RybC5zdGFydFRvb2woe1xuICAgICAgICAgICAgICBzdGFydDogKCkgPT4gdGFyZ2V0LmFwcGx5KHRvb2wpLFxuICAgICAgICAgICAgICBzdG9wOiAoKSA9PiB0b29sLnN0b3AoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHNjb3BlLnRvb2wgPSB0b29sO1xuXG4gICAgICAgICAgbGlua2VyKHNjb3BlLCBjbG9uZSA9PiBlbGVtZW50LmNoaWxkcmVuKCkuYXBwZW5kKGNsb25lKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxufSh3aW5kb3cuYW5ndWxhcikpO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZXJlenkgb24gMi8xLzIwMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpXHJcbiAgLmRpcmVjdGl2ZSgnZHJhZ2dhYmxlJywgWyckZG9jdW1lbnQnLCBmdW5jdGlvbigkZG9jdW1lbnQpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cikge1xyXG4gICAgICB2YXIgc3RhcnRYID0gMCwgc3RhcnRZID0gMCwgeCA9IDAsIHkgPSAwLCAgeDEgPSAwLCB5MSA9IDAsIG9mZnNldFRvcCA9IC0xLG9mZnNldExlZnQgPSAtMTtcclxuICAgICAgdmFyIG1hcFJlY3QgPSBzY29wZS4kcGFyZW50Lm1hcFJlY3QsbmV3TWFwUmVjdCA9IHt9LCBlbGVtUmVjdCA9IHt9O1xyXG4gICAgICB2YXIgdG9vbGJhciA9IGVsZW1lbnQucGFyZW50KCk7XHJcbiAgICAgIGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgLy8gUHJldmVudCBkZWZhdWx0IGRyYWdnaW5nIG9mIHNlbGVjdGVkIGNvbnRlbnRcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmKG9mZnNldFRvcCA9PSAtMSl7XHJcbiAgICAgICAgICBvZmZzZXRUb3AgPSB0b29sYmFyWzBdLm9mZnNldFRvcDtcclxuICAgICAgICAgIG9mZnNldExlZnQgPSB0b29sYmFyWzBdLm9mZnNldExlZnQ7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LnRvcCA9IG9mZnNldFRvcCArIG1hcFJlY3QudG9wO1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC5sZWZ0ID0gb2Zmc2V0TGVmdCArIG1hcFJlY3QubGVmdDtcclxuICAgICAgICAgIG5ld01hcFJlY3QucmlnaHQgPSBvZmZzZXRMZWZ0ICsgbWFwUmVjdC5yaWdodCAtIDU7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LmJvdHRvbSA9IG9mZnNldFRvcCArIG1hcFJlY3QuYm90dG9tIC0gMTU7XHJcbiAgICAgICAgICBlbGVtUmVjdCA9IHRvb2xiYXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnZHJhZ2dhYmxlMicsbmV3TWFwUmVjdCk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBvZmZzZXRUb3AgPSAwO1xyXG4gICAgICAgICAgb2Zmc2V0TGVmdCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXJ0WCA9IGV2ZW50LnBhZ2VYIC0geCAtIG9mZnNldExlZnQ7XHJcbiAgICAgICAgc3RhcnRZID0gZXZlbnQucGFnZVkgLSB5IC0gb2Zmc2V0VG9wO1xyXG4gICAgICAgIGVsZW1lbnQuY3NzKHtcclxuICAgICAgICAgIGN1cnNvcjogJy13ZWJraXQtZ3JhYmJpbmcnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xyXG4gICAgICAgICRkb2N1bWVudC5vbignbW91c2V1cCcsIG1vdXNldXApO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIG1vdXNlbW92ZShldmVudCkge1xyXG4gICAgICAgIHkgPSBldmVudC5wYWdlWSAtIHN0YXJ0WTtcclxuICAgICAgICB4ID0gZXZlbnQucGFnZVggLSBzdGFydFg7XHJcblxyXG4gICAgICAgIGlmKCFpbnNpZGVNYXAoKSkge1xyXG4gICAgICAgICAgdG9vbGJhci5jc3Moe1xyXG4gICAgICAgICAgICB0b3A6IHkxICsgJ3B4JyxcclxuICAgICAgICAgICAgbGVmdDogeDEgKyAncHgnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIHgxID0geDtcclxuICAgICAgICAgIHkxID0geTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIG1vdXNldXAoKSB7XHJcbiAgICAgICAgZWxlbWVudC5jc3Moe1xyXG4gICAgICAgICAgY3Vyc29yOiAnLXdlYmtpdC1ncmFiJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkb2N1bWVudC5vZmYoJ21vdXNlbW92ZScsIG1vdXNlbW92ZSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9mZignbW91c2V1cCcsIG1vdXNldXApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBpbnNpZGVNYXAoKXtcclxuICAgICAgICB0b29sYmFyLmNzcyh7XHJcbiAgICAgICAgICB0b3A6IHkgKyAncHgnLFxyXG4gICAgICAgICAgbGVmdDogeCArICdweCdcclxuICAgICAgICB9KTtcclxuICAgICAgICBlbGVtUmVjdCA9IHRvb2xiYXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgaWYoZWxlbVJlY3QudG9wIDwgbmV3TWFwUmVjdC50b3AgfHwgZWxlbVJlY3QubGVmdCA8IG5ld01hcFJlY3QubGVmdCB8fCBlbGVtUmVjdC5yaWdodCA+IG5ld01hcFJlY3QucmlnaHQgfHwgZWxlbVJlY3QuYm90dG9tID4gbmV3TWFwUmVjdC5ib3R0b20pe1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGVyZXp5IG9uIDAxLzAyLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2xiYXInLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdiBjbGFzcz1cInRvb2xiYXJcIiA+PGRpdiBjbGFzcz1cImRyYWctYnV0dG9uIGdseXBoaWNvbiBnbHlwaGljb24tbWludXNcIiBkcmFnZ2FibGU+PC9kaXY+IDxuZy10cmFuc2NsdWRlPjwvbmctdHJhbnNjbHVkZT48L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKXtcclxuICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3dlYk1hcFNlcnZpY2VMYXllcicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgdXJsIDogJyYnLFxyXG4gICAgICBsYXllcnMgOiAnJidcclxuICAgIH0sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICB9LFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICB2YXIgcHJvdmlkZXIgPSBuZXcgQ2VzaXVtLldlYk1hcFNlcnZpY2VJbWFnZXJ5UHJvdmlkZXIoe1xyXG4gICAgICAgIHVybDogc2NvcGUudXJsKCksXHJcbiAgICAgICAgbGF5ZXJzIDogc2NvcGUubGF5ZXJzKClcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgbGF5ZXIgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLmltYWdlcnlMYXllcnMuYWRkSW1hZ2VyeVByb3ZpZGVyKHByb3ZpZGVyKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLmltYWdlcnlMYXllcnMucmVtb3ZlKGxheWVyKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDIvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnWm9vbVRvb2wnLCBbJ1Rvb2wnLFxyXG4gICAgZnVuY3Rpb24oVG9vbCl7XHJcblxyXG4gICAgICBsZXQgX2NhbWVyYSA9IFN5bWJvbCgnX2NhbWVyYScpO1xyXG4gICAgICBsZXQgX2VsbGlwc29pZCA9IFN5bWJvbCgnX2VsbGlwc29pZCcpO1xyXG5cclxuICAgICAgY2xhc3MgWm9vbVRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihtYXApe1xyXG4gICAgICAgICAgdGhpc1tfY2FtZXJhXSA9IG1hcC5zY2VuZS5jYW1lcmE7XHJcbiAgICAgICAgICB0aGlzW19lbGxpcHNvaWRdID0gbWFwLnNjZW5lLmdsb2JlLmVsbGlwc29pZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXJ0KCl7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgICAgIHN0b3AoKXsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgem9vbUluKGp1bXBzKXtcclxuICAgICAgICAgIGp1bXBzID0gTnVtYmVyLmlzRmluaXRlKGp1bXBzKSA/IGp1bXBzIDogMTtcclxuICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBqdW1wczsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IGNhbWVyYUhlaWdodCA9IHRoaXNbX2VsbGlwc29pZF0uY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpc1tfY2FtZXJhXS5wb3NpdGlvbikuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgbW92ZVJhdGUgPSBjYW1lcmFIZWlnaHQgLyAxMDAuMDtcclxuICAgICAgICAgICAgdGhpc1tfY2FtZXJhXS5tb3ZlRm9yd2FyZChtb3ZlUmF0ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB6b29tT3V0KGp1bXBzKXtcclxuICAgICAgICAgIGp1bXBzID0gTnVtYmVyLmlzRmluaXRlKGp1bXBzKSA/IGp1bXBzIDogMTtcclxuICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBqdW1wczsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IGNhbWVyYUhlaWdodCA9IHRoaXNbX2VsbGlwc29pZF0uY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpc1tfY2FtZXJhXS5wb3NpdGlvbikuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgbW92ZVJhdGUgPSBjYW1lcmFIZWlnaHQgLyAxMDAuMDtcclxuICAgICAgICAgICAgdGhpc1tfY2FtZXJhXS5tb3ZlQmFja3dhcmQobW92ZVJhdGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFpvb21Ub29sO1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAyLzAyLzE1LlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnem9vbVdpZGdldCcsIFsnJGRvY3VtZW50JyxcclxuICAgIGZ1bmN0aW9uKCRkb2N1bWVudCl7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlOiAnXnRvb2wnLFxyXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInpvb20td2lkZ2V0XCI+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJ6b29tLWluLWJ0blwiPicgK1xyXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIG5nLWNsaWNrPVwiem9vbUluKCk7XCI+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi16b29tLWluXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xyXG4gICAgICAgICc8L2J1dHRvbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJzbGlkZXJcIj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJiYXJcIj4nICtcclxuICAgICAgICAnPC9zcGFuPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cInBvaW50ZXJcIj4nICtcclxuICAgICAgICAnPC9zcGFuPicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInpvb20tb3V0LWJ0blwiPicgK1xyXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIG5nLWNsaWNrPVwiem9vbU91dCgpO1wiPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1vdXRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXHJcbiAgICAgICAgJzwvYnV0dG9uPicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xDdHJsKXtcclxuICAgICAgICAgIGlmKGlzRmluaXRlKGF0dHJzLndpZHRoKSB8fCBpc0Zpbml0ZShhdHRycy5oZWlnaHQpKXtcclxuICAgICAgICAgICAgbGV0IHdpZHRoID0gIGlzRmluaXRlKGF0dHJzLndpZHRoKSA/IE51bWJlci5wYXJzZUludChhdHRycy53aWR0aCkgKyAncHgnIDogJ2luaGVyaXQnO1xyXG4gICAgICAgICAgICBsZXQgaGVpZ2h0ID0gIGlzRmluaXRlKGF0dHJzLmhlaWdodCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMuaGVpZ2h0KSArICdweCcgOiAnaW5oZXJpdCc7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtwb3NpdGlvbjogJ3JlbGF0aXZlJywgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBtaW5MZXZlbCA9IGlzRmluaXRlKGF0dHJzLm1pbikgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMubWluKSA6IDA7XHJcbiAgICAgICAgICBsZXQgbWF4TGV2ZWwgPSBpc0Zpbml0ZShhdHRycy5tYXgpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1heCkgOiAxMDA7XHJcblxyXG4gICAgICAgICAgaWYobWluTGV2ZWwgPCAwIHx8IG1heExldmVsIDwgMCB8fCBtaW5MZXZlbCA+PSBtYXhMZXZlbCl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm1pbiBvciBtYXggYXR0cmlidXRlcyB2YWx1ZSBhcmUgaW52YWxpZC5cIik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGV0IGp1bXBzID0gaXNGaW5pdGUoYXR0cnMuanVtcCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMuanVtcCkgOiAxMDtcclxuXHJcbiAgICAgICAgICBsZXQgem9vbVRvb2wgPSB0b29sQ3RybC5nZXRUb29sKCk7XHJcblxyXG4gICAgICAgICAgaWYoKHR5cGVvZiB6b29tVG9vbC56b29tSW4gIT09ICdmdW5jdGlvbicpIHx8ICh0eXBlb2Ygem9vbVRvb2wuem9vbU91dCAhPT0gJ2Z1bmN0aW9uJykpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiWm9vbSB3aWRnZXQgbXVzdCBiZSBpbnNpZGUgdG9vbCB3aXRoIFpvb21Ub29sIHR5cGUuXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBsZXZlbFZhbHVlID0gOTAgLyAobWF4TGV2ZWwgLSBtaW5MZXZlbCk7XHJcbiAgICAgICAgICBsZXQgY3VycmVudExldmVsID0gKG1heExldmVsIC0gbWluTGV2ZWwpIC8gMjtcclxuICAgICAgICAgIGxldCB6b29tTGV2ZWwgPSAobWF4TGV2ZWwgKyBtaW5MZXZlbCkgLyAyO1xyXG4gICAgICAgICAgbGV0IHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcclxuICAgICAgICAgIGxldCBjdXJyZW50UG9pbnRlckhlaWdodCA9IDQ1O1xyXG5cclxuICAgICAgICAgIGxldCBwb2ludGVyICA9IGFuZ3VsYXIuZWxlbWVudChlbGVtZW50LmZpbmQoJ3NwYW4nKVsyXSk7XHJcbiAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudExldmVsICogbGV2ZWxWYWx1ZSArICclJyk7XHJcblxyXG4gICAgICAgICAgbGV0IGNsaWVudFkgPSBudWxsO1xyXG4gICAgICAgICAgbGV0IGJhckhlaWdodCA9IHBvaW50ZXJbMF0uY2xpZW50SGVpZ2h0ICogMTA7XHJcbiAgICAgICAgICBsZXQgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgcG9pbnRlci5vbignbW91c2Vkb3duJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICAgICAgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcclxuICAgICAgICAgICAgcG9pbnRlci5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNsaWVudFkgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgIGNsaWVudFkgPSBudWxsO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNlbW92ZScsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgaWYoY2xpZW50WSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgbGV0IGRlbHRhWSA9IGNsaWVudFkgLSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgICAgICAgIGxldCBwZXJjZW50ID0gKE1hdGguYWJzKGRlbHRhWSkgKiAxMDAgLyBiYXJIZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICBpZihkZWx0YVkgPiAwKXtcclxuICAgICAgICAgICAgICAgIGlmKHN0YXJ0UG9pbnRlckhlaWdodCAtIHBlcmNlbnQgPj0gMCl7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudDtcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpZihzdGFydFBvaW50ZXJIZWlnaHQgKyBwZXJjZW50IDw9IDkwKXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBzdGFydFBvaW50ZXJIZWlnaHQgKyBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gOTA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwgPSBNYXRoLnRydW5jKGN1cnJlbnRQb2ludGVySGVpZ2h0IC8gbGV2ZWxWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgem9vbUxldmVsID0gbWF4TGV2ZWwgLSBjdXJyZW50TGV2ZWw7XHJcbiAgICAgICAgICAgICAgaWYoem9vbUxldmVsID4gdGVtcExldmVsKXtcclxuICAgICAgICAgICAgICAgIHpvb21Ub29sLnpvb21Jbigoem9vbUxldmVsIC0gdGVtcExldmVsKSAqIGp1bXBzKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYoem9vbUxldmVsIDwgdGVtcExldmVsKXtcclxuICAgICAgICAgICAgICAgIHpvb21Ub29sLnpvb21PdXQoKHRlbXBMZXZlbCAtIHpvb21MZXZlbCkgKiBqdW1wcyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcclxuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudExldmVsICogbGV2ZWxWYWx1ZSArICclJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHNjb3BlLnpvb21JbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHpvb21MZXZlbCA8IG1heExldmVsKXtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwrKztcclxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwtLTtcclxuICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWU7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRQb2ludGVySGVpZ2h0ICsgJyUnKTtcclxuICAgICAgICAgICAgICB6b29tVG9vbC56b29tSW4oanVtcHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLnpvb21PdXQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZih6b29tTGV2ZWwgPiBtaW5MZXZlbCl7XHJcbiAgICAgICAgICAgICAgem9vbUxldmVsLS07XHJcbiAgICAgICAgICAgICAgY3VycmVudExldmVsKys7XHJcbiAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50UG9pbnRlckhlaWdodCArICclJyk7XHJcbiAgICAgICAgICAgICAgem9vbVRvb2wuem9vbU91dChqdW1wcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDA1LzAyLzE1LlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ1pvb21BcmVhVG9vbCcsIFsnVG9vbCcsICdDZXNpdW0nLFxyXG4gICAgZnVuY3Rpb24oVG9vbCwgQ2VzaXVtKXtcclxuXHJcbiAgICAgIGxldCBfbWFwID0gU3ltYm9sKCdfbWFwJyk7XHJcbiAgICAgIGxldCBfZW5zdXJlRmx5ID0gU3ltYm9sKCdfZW5zdXJlRmx5Jyk7XHJcbiAgICAgIGxldCBfaW5pdE1hcE1vdXNlSGFuZGxlcnMgPSBTeW1ib2woJ19pbml0TWFwTW91c2VIYW5kbGVycycpO1xyXG4gICAgICBsZXQgX3JlbW92ZU1hcE1vdXNlSGFuZGxlcnMgPSBTeW1ib2woJ19yZW1vdmVNYXBNb3VzZUhhbmRsZXJzJyk7XHJcbiAgICAgIGxldCBfaW5pdENlc2l1bU1vdXNlSGFuZGxlcnMgPSBTeW1ib2woJ19pbml0Q2VzaXVtTW91c2VIYW5kbGVycycpO1xyXG4gICAgICBsZXQgX3JlbW92ZUNlc2l1bU1vdXNlSGFuZGxlcnMgPSBTeW1ib2woJ19yZW1vdmVDZXNpdW1Nb3VzZUhhbmRsZXJzJyk7XHJcblxyXG4gICAgICBjbGFzcyBab29tQXJlYVRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihtYXApe1xyXG4gICAgICAgICAgdGhpc1tfbWFwXSA9IG1hcDtcclxuICAgICAgICAgIHRoaXNbX2Vuc3VyZUZseV0gPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFtfaW5pdE1hcE1vdXNlSGFuZGxlcnNdKCl7XHJcbiAgICAgICAgICBsZXQgcGFnZVggPSAwO1xyXG4gICAgICAgICAgbGV0IHBhZ2VZID0gMDtcclxuICAgICAgICAgIGxldCBzdGFydFggPSAwO1xyXG4gICAgICAgICAgbGV0IHN0YXJ0WSA9IDA7XHJcbiAgICAgICAgICBsZXQgZGVsdGFYID0gMDtcclxuICAgICAgICAgIGxldCBkZWx0YVkgPSAwO1xyXG4gICAgICAgICAgbGV0IHNlbGVjdGVkU3RhcnQgPSBmYWxzZTtcclxuICAgICAgICAgIGxldCBzZWxlY3RvciA9IGFuZ3VsYXIuZWxlbWVudCgnPGRpdj48L2Rpdj4nKTtcclxuICAgICAgICAgIGxldCBtYXBDb250YWluZXIgPSBhbmd1bGFyLmVsZW1lbnQodGhpc1tfbWFwXS5jYW52YXMucGFyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgc2VsZWN0b3IuY3NzKCdib3JkZXInLCAnMnB4IGRhc2hlZCB3aGl0ZScpO1xyXG5cclxuICAgICAgICAgIG1hcENvbnRhaW5lci5vbignbW91c2Vkb3duJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBwYWdlWCA9IGV2ZW50LnBhZ2VYO1xyXG4gICAgICAgICAgICBwYWdlWSA9IGV2ZW50LnBhZ2VZO1xyXG4gICAgICAgICAgICBzdGFydFggPSBldmVudC5vZmZzZXRYO1xyXG4gICAgICAgICAgICBzdGFydFkgPSBldmVudC5vZmZzZXRZO1xyXG4gICAgICAgICAgICB0aGlzW19lbnN1cmVGbHldID0gZmFsc2U7XHJcbiAgICAgICAgICAgIG1hcENvbnRhaW5lci5jc3MoJ2N1cnNvcicsICd6b29tLWluJyk7XHJcblxyXG4gICAgICAgICAgICBzZWxlY3Rvci5jc3Moe1xyXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgIHRvcDogYCR7c3RhcnRZfXB4YCxcclxuICAgICAgICAgICAgICBsZWZ0OiBgJHtzdGFydFh9cHhgLFxyXG4gICAgICAgICAgICAgIHdpZHRoOiAnMHB4JyxcclxuICAgICAgICAgICAgICBoZWlnaHQ6ICcwcHgnXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbWFwQ29udGFpbmVyLmFwcGVuZChzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSB0cnVlO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgbWFwQ29udGFpbmVyLm9uKCdtb3VzZW1vdmUnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKCFzZWxlY3RlZFN0YXJ0KXtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlbHRhWCA9ICBldmVudC5wYWdlWCAtIHBhZ2VYO1xyXG4gICAgICAgICAgICBkZWx0YVkgPSBldmVudC5wYWdlWSAtIHBhZ2VZO1xyXG5cclxuICAgICAgICAgICAgbGV0IHNlbGVjdG9yU3R5bGUgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmKGRlbHRhWCA+IDApe1xyXG4gICAgICAgICAgICAgIHNlbGVjdG9yU3R5bGUud2lkdGggPSBgJHtkZWx0YVh9cHhgO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKGRlbHRhWCA8IDApe1xyXG4gICAgICAgICAgICAgIGRlbHRhWCA9IE1hdGguYWJzKGRlbHRhWCk7XHJcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS53aWR0aCA9IGAke2RlbHRhWH1weGA7XHJcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS5sZWZ0ID0gYCR7c3RhcnRYIC0gZGVsdGFYfXB4YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihkZWx0YVkgPiAwKXtcclxuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLmhlaWdodCA9IGAke2RlbHRhWX1weGA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoZGVsdGFZIDwgMCl7XHJcbiAgICAgICAgICAgICAgZGVsdGFZID0gTWF0aC5hYnMoZGVsdGFZKTtcclxuICAgICAgICAgICAgICBzZWxlY3RvclN0eWxlLmhlaWdodCA9IGAke2RlbHRhWX1weGA7XHJcbiAgICAgICAgICAgICAgc2VsZWN0b3JTdHlsZS50b3AgPSBgJHtzdGFydFkgLSBkZWx0YVl9cHhgO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxlY3Rvci5jc3Moc2VsZWN0b3JTdHlsZSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBtYXBDb250YWluZXIub24oJ21vdXNldXAnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2VsZWN0b3IucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIG1hcENvbnRhaW5lci5jc3MoJ2N1cnNvcicsICcnKTtcclxuICAgICAgICAgICAgdGhpc1tfZW5zdXJlRmx5XSA9IHRydWU7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBtYXBDb250YWluZXIub24oJ21vdXNlbGVhdmUnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkU3RhcnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgbWFwQ29udGFpbmVyLmNzcygnY3Vyc29yJywgJycpO1xyXG4gICAgICAgICAgICBzZWxlY3Rvci5yZW1vdmUoKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgW19yZW1vdmVNYXBNb3VzZUhhbmRsZXJzXSgpe1xyXG4gICAgICAgICAgbGV0IG1hcENvbnRhaW5lciA9IGFuZ3VsYXIuZWxlbWVudCh0aGlzW19tYXBdLmNhbnZhcy5wYXJlbnROb2RlKTtcclxuICAgICAgICAgIG1hcENvbnRhaW5lci51bmJpbmQoJ21vdXNlZG93bicpO1xyXG4gICAgICAgICAgbWFwQ29udGFpbmVyLnVuYmluZCgnbW91c2Vtb3ZlJyk7XHJcbiAgICAgICAgICBtYXBDb250YWluZXIudW5iaW5kKCdtb3VzZXVwJyk7XHJcbiAgICAgICAgICBtYXBDb250YWluZXIudW5iaW5kKCdtb3VzZWxlYXZlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBbX2luaXRDZXNpdW1Nb3VzZUhhbmRsZXJzXSgpe1xyXG4gICAgICAgICAgbGV0IHN0YXJ0UG9zaXRpb24gPSBudWxsO1xyXG4gICAgICAgICAgbGV0IGVuZFBvc2l0aW9uID0gbnVsbDtcclxuICAgICAgICAgIGxldCBjYW1lcmEgPSB0aGlzW19tYXBdLnNjZW5lLmNhbWVyYTtcclxuICAgICAgICAgIGxldCBlbGxpcHNvaWQgPSB0aGlzW19tYXBdLnNjZW5lLmdsb2JlLmVsbGlwc29pZDtcclxuICAgICAgICAgIGxldCBoYW5kbGVyID0gbmV3IENlc2l1bS5TY3JlZW5TcGFjZUV2ZW50SGFuZGxlcih0aGlzW19tYXBdLmNhbnZhcyk7XHJcblxyXG4gICAgICAgICAgaGFuZGxlci5zZXRJbnB1dEFjdGlvbihtb3ZlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjYXJ0ZXNpYW4gPSBjYW1lcmEucGlja0VsbGlwc29pZChtb3ZlbWVudC5wb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZihjYXJ0ZXNpYW4pe1xyXG4gICAgICAgICAgICAgIGxldCBjYXJ0b2dyYXBoaWMgPSBlbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWMoY2FydGVzaWFuKTtcclxuICAgICAgICAgICAgICBzdGFydFBvc2l0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgbG9uOiBDZXNpdW0uTWF0aC50b0RlZ3JlZXMoY2FydG9ncmFwaGljLmxvbmdpdHVkZSksXHJcbiAgICAgICAgICAgICAgICBsYXQ6IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubGF0aXR1ZGUpXHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgc3RhcnRQb3NpdGlvbiA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIENlc2l1bS5TY3JlZW5TcGFjZUV2ZW50VHlwZS5MRUZUX0RPV04pO1xyXG5cclxuICAgICAgICAgIGhhbmRsZXIuc2V0SW5wdXRBY3Rpb24obW92ZW1lbnQgPT4gIHtcclxuICAgICAgICAgICAgbGV0IGNhcnRlc2lhbiA9IGNhbWVyYS5waWNrRWxsaXBzb2lkKG1vdmVtZW50LnBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGlmKGNhcnRlc2lhbil7XHJcbiAgICAgICAgICAgICAgbGV0IGNhcnRvZ3JhcGhpYyA9IGVsbGlwc29pZC5jYXJ0ZXNpYW5Ub0NhcnRvZ3JhcGhpYyhjYXJ0ZXNpYW4pO1xyXG4gICAgICAgICAgICAgIGVuZFBvc2l0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgbG9uOiBDZXNpdW0uTWF0aC50b0RlZ3JlZXMoY2FydG9ncmFwaGljLmxvbmdpdHVkZSksXHJcbiAgICAgICAgICAgICAgICBsYXQ6IENlc2l1bS5NYXRoLnRvRGVncmVlcyhjYXJ0b2dyYXBoaWMubGF0aXR1ZGUpXHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgZW5kUG9zaXRpb24gPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZih0aGlzW19lbnN1cmVGbHldICYmIHN0YXJ0UG9zaXRpb24gIT09IG51bGwgJiYgZW5kUG9zaXRpb24gIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgdGhpc1tfZW5zdXJlRmx5XSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICBsZXQgcmVjdGFuZ2xlID0gQ2VzaXVtLlJlY3RhbmdsZS5mcm9tRGVncmVlcyhcclxuICAgICAgICAgICAgICAgIHN0YXJ0UG9zaXRpb24ubG9uLCBzdGFydFBvc2l0aW9uLmxhdCwgZW5kUG9zaXRpb24ubG9uLCBlbmRQb3NpdGlvbi5sYXRcclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICBjYW1lcmEuZmx5VG9SZWN0YW5nbGUoe1xyXG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb246IHJlY3RhbmdsZVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBDZXNpdW0uU2NyZWVuU3BhY2VFdmVudFR5cGUuTEVGVF9VUCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBbX3JlbW92ZUNlc2l1bU1vdXNlSGFuZGxlcnNdKCl7XHJcbiAgICAgICAgICBsZXQgaGFuZGxlciA9IG5ldyBDZXNpdW0uU2NyZWVuU3BhY2VFdmVudEhhbmRsZXIodGhpc1tfbWFwXS5jYW52YXMpO1xyXG4gICAgICAgICAgaGFuZGxlci5yZW1vdmVJbnB1dEFjdGlvbihDZXNpdW0uU2NyZWVuU3BhY2VFdmVudFR5cGUuTEVGVF9ET1dOKTtcclxuICAgICAgICAgIGhhbmRsZXIucmVtb3ZlSW5wdXRBY3Rpb24oQ2VzaXVtLlNjcmVlblNwYWNlRXZlbnRUeXBlLkxFRlRfVVApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhcnQoKXtcclxuICAgICAgICAgIHRoaXNbX21hcF0uc2NlbmUuc2NyZWVuU3BhY2VDYW1lcmFDb250cm9sbGVyLmVuYWJsZVJvdGF0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgdGhpc1tfZW5zdXJlRmx5XSA9IGZhbHNlO1xyXG4gICAgICAgICAgdGhpc1tfaW5pdENlc2l1bU1vdXNlSGFuZGxlcnNdKCk7XHJcbiAgICAgICAgICB0aGlzW19pbml0TWFwTW91c2VIYW5kbGVyc10oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0b3AoKXtcclxuICAgICAgICAgIHRoaXNbX21hcF0uc2NlbmUuc2NyZWVuU3BhY2VDYW1lcmFDb250cm9sbGVyLmVuYWJsZVJvdGF0ZSA9IHRydWU7XHJcbiAgICAgICAgICB0aGlzW19yZW1vdmVDZXNpdW1Nb3VzZUhhbmRsZXJzXSgpO1xyXG4gICAgICAgICAgdGhpc1tfcmVtb3ZlTWFwTW91c2VIYW5kbGVyc10oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBab29tQXJlYVRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==