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
      compile: function(element, attrs) {
        return function(scope, element, attrs, toolBarCtrl, linker) {
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
        };
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
    var ZoomTool = function ZoomTool(map) {
      this._camera = map.scene.camera;
      this._ellipsoid = map.scene.globe.ellipsoid;
    };
    ($traceurRuntime.createClass)(ZoomTool, {
      start: function() {
        console.log('Examp-Tool start!');
      },
      stop: function() {
        console.log('Examp-Tool start!');
      },
      cancel: function() {
        console.log('Examp-Tool start!');
      },
      onUpdate: function() {
        console.log('Examp-Tool start!');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Rvb2wuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmQvYmlsbGJvYXJkLmpzIiwibWFwLWNvbXBvbmVudHMvYmlsbGJvYXJkcy1sYXllci9iaWxsYm9hcmRzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvY29tcGxleC1sYXllci9jb21wbGV4LWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbGFiZWwvbGFiZWwuanMiLCJtYXAtY29tcG9uZW50cy9sYWJlbHMtbGF5ZXIvbGFiZWxzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmUvcG9seWxpbmUuanMiLCJtYXAtY29tcG9uZW50cy9tYXAvbWFwLWRpcmVjdGl2ZS5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC1iYXIuZHJ2LmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbC90b29sLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xiYXIvZHJhZ2dhYmxlLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbGJhci90b29sYmFyLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmVzLWxheWVyL3BvbHlsaW5lcy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3dlYi1tYXAtc2VydmljZS1sYXllci93ZWItbWFwLXNlcnZpY2UtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tL3pvb20tdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS13aWRnZXQuZHJ2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbmd1bGFyLWNlc2l1bS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTAvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScsIFsnb2JzZXJ2YWJsZUNvbGxlY3Rpb24nXSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuc2VydmljZSgnQmlsbEJvYXJkQXR0cmlidXRlcycsIGZ1bmN0aW9uKCRwYXJzZSkge1xyXG4gIHRoaXMuY2FsY0F0dHJpYnV0ZXMgPSBmdW5jdGlvbihhdHRycywgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgaW1hZ2UgOiAkcGFyc2UoYXR0cnMuaW1hZ2UpKGNvbnRleHQpXHJcbiAgICB9O1xyXG4gICAgdmFyIHBvc2l0aW9uQXR0ciA9ICRwYXJzZShhdHRycy5wb3NpdGlvbikoY29udGV4dCk7XHJcbiAgICByZXN1bHQucG9zaXRpb24gPSBDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb25BdHRyLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb25BdHRyLmxvbmdpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uQXR0ci5hbHRpdHVkZSkgfHwgMCk7XHJcblxyXG4gICAgdmFyIGNvbG9yID0gJHBhcnNlKGF0dHJzLmNvbG9yKShjb250ZXh0KTtcclxuICAgIGlmIChjb2xvcikge1xyXG4gICAgICByZXN1bHQuY29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKGNvbG9yKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTAvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ0Nlc2l1bScsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBDZXNpdW07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAxLzAyLzE1LlxyXG4gKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ1Rvb2wnLCBbXHJcbiAgICBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgY2xhc3MgVG9vbCB7XHJcbiAgICAgICAgY29uc3RydWN0b3IobWFwKXsgdGhpcy5fbWFwID0gbWFwOyB9XHJcbiAgICAgICAgc3RhcnQoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiOyB9XHJcbiAgICAgICAgc3RvcCgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7IH1cclxuICAgICAgICBjYW5jZWwoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cclxuICAgICAgICBvblVwZGF0ZSgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7fVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gVG9vbDtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdiaWxsYm9hcmQnLCBmdW5jdGlvbihCaWxsQm9hcmRBdHRyaWJ1dGVzKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdeYmlsbGJvYXJkc0xheWVyJyxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGJpbGxib2FyZHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgc2NvcGUpO1xyXG5cclxuICAgICAgdmFyIGJpbGxib2FyZCA9IGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLmFkZChiaWxsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgYmlsbGJvYXJkc0xheWVyQ3RybC5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uKCkucmVtb3ZlKGJpbGxib2FyZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkc0xheWVyJywgZnVuY3Rpb24oJHBhcnNlLCBPYnNlcnZhYmxlQ29sbGVjdGlvbiwgQmlsbEJvYXJkQXR0cmlidXRlcywgQ2VzaXVtKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUsICRhdHRycykge1xyXG4gICAgICB0aGlzLmdldEJpbGxib2FyZENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoJGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBnZXQgY29sbGVjdGlvbiBpZiBsYXllciBpcyBib3VuZCB0byBPYnNlcnZhYmxlQ29sbGVjdGlvbicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uQmlsbGJvYXJkQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgdmFyIENPTExFQ1RJT05fUkVHRVhQID0gL1xccyooW1xcJFxcd11bXFwkXFx3XSopXFxzK2luXFxzKyhbXFwkXFx3XVtcXCRcXHddKikvO1xyXG4gICAgICAgICAgdmFyIG1hdGNoID0gYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24ubWF0Y2goQ09MTEVDVElPTl9SRUdFWFApO1xyXG4gICAgICAgICAgdmFyIGl0ZW1OYW1lID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICB2YXIgY29sbGVjdGlvbiA9ICRwYXJzZShtYXRjaFsyXSkoc2NvcGUpO1xyXG4gICAgICAgICAgaWYgKCFjb2xsZWN0aW9uIGluc3RhbmNlb2YgT2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvYnNlcnZhYmxlLWNvbGxlY3Rpb24gbXVzdCBiZSBvZiB0eXBlIE9ic2VydmFibGVDb2xsZWN0aW9uLicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhZGRCaWxsYm9hcmQgPSBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICAgICAgICBjb250ZXh0W2l0ZW1OYW1lXSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24uYWRkKGJpbGxEZXNjKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb2xsZWN0aW9uLmdldERhdGEoKSwgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgIGFkZEJpbGxib2FyZChpdGVtKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vbkFkZChhZGRCaWxsYm9hcmQpO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uVXBkYXRlKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vblJlbW92ZShmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24ucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24uZ2V0KGluZGV4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDE3LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2NvbXBsZXhMYXllcicsIGZ1bmN0aW9uKCRsb2cpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29tcGlsZSA6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50LmNoaWxkcmVuKCksIGZ1bmN0aW9uIChjaGlsZCkge1xyXG5cclxuICAgICAgICAgIHZhciBsYXllciA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICBpZiAoY2hpbGQudGFnTmFtZSA9PT0gJ0JJTExCT0FSRCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxiaWxsYm9hcmRzLWxheWVyPjwvYmlsbGJvYXJkcy1sYXllcj4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLnRhZ05hbWUgPT09ICdMQUJFTCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxsYWJlbHMtbGF5ZXI+PC9sYWJlbHMtbGF5ZXI+Jyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXllcikge1xyXG4gICAgICAgICAgICAkbG9nLndhcm4oJ0ZvdW5kIGFuIHVua25vd24gY2hpbGQgb2Ygb2YgY29tcGxleC1sYXllci4gUmVtb3ZpbmcuLi4nKTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGNoaWxkKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY2hpbGQuYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcclxuICAgICAgICAgICAgICBsYXllci5hdHRyKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudFswXS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG4gICAgICAgICAgICAgIGlmICghYW5ndWxhci5lbGVtZW50KGNoaWxkKS5hdHRyKGF0dHIubmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGxheWVyLmF0dHIoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLnJlcGxhY2VXaXRoKGxheWVyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdsYWJlbCcsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmxhYmVsc0xheWVyJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBjb2xvciA6ICcmJyxcclxuICAgICAgdGV4dCA6ICcmJyxcclxuICAgICAgcG9zaXRpb24gOiAnJidcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBsYWJlbHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGxhYmVsRGVzYyA9IHt9O1xyXG5cclxuICAgICAgdmFyIHBvc2l0aW9uID0gc2NvcGUucG9zaXRpb24oKTtcclxuICAgICAgbGFiZWxEZXNjLnBvc2l0aW9uID0gQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24ubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24uYWx0aXR1ZGUpIHx8IDApO1xyXG5cclxuICAgICAgdmFyIGNvbG9yID0gc2NvcGUuY29sb3IoKTtcclxuICAgICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgICAgbGFiZWxEZXNjLmNvbG9yID0gY29sb3I7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxhYmVsRGVzYy50ZXh0ID0gc2NvcGUudGV4dCgpO1xyXG5cclxuICAgICAgdmFyIGxhYmVsID0gbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLmFkZChsYWJlbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxhYmVsc0xheWVyQ3RybC5nZXRMYWJlbENvbGxlY3Rpb24oKS5yZW1vdmUobGFiZWwpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsc0xheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge30sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuZ2V0TGFiZWxDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uTGFiZWxDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBnaWxuaXMyIG9uIDE4LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3BvbHlsaW5lJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdecG9seWxpbmVzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB3aWR0aCA6ICcmJyxcclxuICAgICAgcG9zaXRpb25zIDogJyYnXHJcbiAgICB9LFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgcG9seWxpbmVzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBwb2x5bGluZURlc2MgPSB7fTtcclxuXHJcbiAgICAgIGlmICghYW5ndWxhci5pc0RlZmluZWQoc2NvcGUucG9zaXRpb25zKSB8fCAhYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLnBvc2l0aW9ucykpe1xyXG4gICAgICAgIHRocm93IFwiUG9seWxpbmUgcG9zaXRpb25zIG11c3QgYmUgZGVmaW5lZCBhcyBhIGZ1bmN0aW9uXCI7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHBvc2l0aW9ucyA9IHNjb3BlLnBvc2l0aW9ucygpO1xyXG4gICAgICBwb2x5bGluZURlc2MucG9zaXRpb25zID0gW107XHJcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChwb3NpdGlvbnMsIGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcG9seWxpbmVEZXNjLnBvc2l0aW9ucy5wdXNoKENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbi5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmxvbmdpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmFsdGl0dWRlKSB8fCAwKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNlc2l1bUNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZygnYmxhY2snKTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLmNvbG9yKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUuY29sb3IpKXtcclxuICAgICAgICBjZXNpdW1Db2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoc2NvcGUuY29sb3IoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICBwb2x5bGluZURlc2MubWF0ZXJpYWwgPSBDZXNpdW0uTWF0ZXJpYWwuZnJvbVR5cGUoJ0NvbG9yJyk7XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5tYXRlcmlhbC51bmlmb3Jtcy5jb2xvciA9IGNlc2l1bUNvbG9yO1xyXG5cclxuICAgICAgcG9seWxpbmVEZXNjLndpZHRoID0gMTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLndpZHRoKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUud2lkdGgpKXtcclxuICAgICAgICBwb2x5bGluZURlc2Mud2lkdGggPSBzY29wZS53aWR0aCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcG9seWxpbmUgPSBwb2x5bGluZXNMYXllckN0cmwuZ2V0UG9seWxpbmVDb2xsZWN0aW9uKCkuYWRkKHBvbHlsaW5lRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcG9seWxpbmVzTGF5ZXJDdHJsLmdldFBvbHlsaW5lQ29sbGVjdGlvbigpLnJlbW92ZShwb2x5bGluZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbWFwJywgZnVuY3Rpb24oKSB7XHJcbiAgZnVuY3Rpb24gZ2V0U2NlbmVNb2RlKGRpbWVuc2lvbnMpIHtcclxuICAgIGlmIChkaW1lbnNpb25zID09IDIpIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUyRDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGRpbWVuc2lvbnMgPT0gMi41KSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLkNPTFVNQlVTX1ZJRVc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUzRDtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICB0ZW1wbGF0ZSA6ICc8ZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+IDxkaXYgY2xhc3M9XCJtYXAtY29udGFpbmVyXCI+PC9kaXY+IDwvZGl2PicsXHJcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBkaW1lbnNpb25zIDogJ0AnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY2VzaXVtO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUub25Ecm9wID0gZnVuY3Rpb24oZXZlbnQpe1xyXG5cclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xyXG4gICAgICAgIGlmICghc2NvcGUuZGltZW5zaW9ucykge1xyXG4gICAgICAgICAgc2NvcGUuZGltZW5zaW9ucyA9IDM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY29wZS5jZXNpdW0gPSBuZXcgQ2VzaXVtLkNlc2l1bVdpZGdldChlbGVtZW50LmZpbmQoJ2RpdicpWzBdLCB7XHJcbiAgICAgICAgICBzY2VuZU1vZGU6IGdldFNjZW5lTW9kZShzY29wZS5kaW1lbnNpb25zKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNjb3BlLm1hcFJlY3QgPSBlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sQmFyJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXF1aXJlOiAnXm1hcCcsXHJcbiAgICAgICAgLy90cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgIC8vdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU9XCJcIj48L2Rpdj4nLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJyxcclxuICAgICAgICAgIGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbGluazoge1xyXG4gICAgICAgICAgcHJlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpe1xyXG4gICAgICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sJywgWydUb29sJyxcclxuICAgIGZ1bmN0aW9uKFRvb2wpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZTogJ150b29sYmFyJyxcclxuICAgICAgICB0cmFuc2NsdWRlOiAnZWxlbWVudCcsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgIHR5cGU6ICc9J1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLFxyXG4gICAgICAgICAgZnVuY3Rpb24oJHNjb3BlKXtcclxuICAgICAgICAgICAgdGhpcy5nZXRUb29sID0gKCkgPT4gJHNjb3BlLnRvb2w7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBjb21waWxlOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB0b29sQmFyQ3RybCwgbGlua2VyKXtcclxuICAgICAgICAgICAgaWYoISh0eXBlb2Ygc2NvcGUudHlwZSA9PT0gJ2Z1bmN0aW9uJykpe1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0eXBlIGF0dHIgbXVzdCBiZSBjb25zdHJ1Y3Rvci5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB0b29sID0gbmV3IHNjb3BlLnR5cGUodG9vbEJhckN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkpO1xyXG5cclxuICAgICAgICAgICAgaWYoISh0b29sIGluc3RhbmNlb2YgVG9vbCkpe1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0b29sIG11c3QgYmUgaW5zdGFuY2Ugb2YgVG9vbC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBwcm94eSA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZm9yKGxldCBrZXkgaW4gdG9vbCl7XHJcbiAgICAgICAgICAgICAgaWYoa2V5ID09PSAnc3RhcnQnKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksIGtleSwge1xyXG4gICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiB0b29sW2tleV0sXHJcbiAgICAgICAgICAgICAgICBzZXQ6IHZhbCA9PiB7IHRvb2xba2V5XSA9IHZhbDsgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksICdzdGFydCcsIHtcclxuICAgICAgICAgICAgICBnZXQ6ICgpID0+ICgpID0+IHRvb2xCYXJDdHJsLnN0YXJ0VG9vbCh0b29sKVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLnRvb2wgPSBwcm94eTtcclxuXHJcbiAgICAgICAgICAgIGxpbmtlcihzY29wZSwgKGNsb25lKSA9PiB7XHJcbiAgICAgICAgICAgICAgZWxlbWVudC5wYXJlbnQoKS5hcHBlbmQoY2xvbmUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGVyZXp5IG9uIDIvMS8yMDE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKVxyXG4gIC5kaXJlY3RpdmUoJ2RyYWdnYWJsZScsIFsnJGRvY3VtZW50JywgZnVuY3Rpb24oJGRvY3VtZW50KSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcclxuICAgICAgdmFyIHN0YXJ0WCA9IDAsIHN0YXJ0WSA9IDAsIHggPSAwLCB5ID0gMCwgIHgxID0gMCwgeTEgPSAwLCBvZmZzZXRUb3AgPSAtMSxvZmZzZXRMZWZ0ID0gLTE7XHJcbiAgICAgIHZhciBtYXBSZWN0ID0gc2NvcGUuJHBhcmVudC5tYXBSZWN0LG5ld01hcFJlY3QgPSB7fSwgZWxlbVJlY3QgPSB7fTtcclxuICAgICAgdmFyIHRvb2xiYXIgPSBlbGVtZW50LnBhcmVudCgpO1xyXG4gICAgICBlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdCBkcmFnZ2luZyBvZiBzZWxlY3RlZCBjb250ZW50XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZihvZmZzZXRUb3AgPT0gLTEpe1xyXG4gICAgICAgICAgb2Zmc2V0VG9wID0gdG9vbGJhclswXS5vZmZzZXRUb3A7XHJcbiAgICAgICAgICBvZmZzZXRMZWZ0ID0gdG9vbGJhclswXS5vZmZzZXRMZWZ0O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC50b3AgPSBvZmZzZXRUb3AgKyBtYXBSZWN0LnRvcDtcclxuICAgICAgICAgIG5ld01hcFJlY3QubGVmdCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LmxlZnQ7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LnJpZ2h0ID0gb2Zmc2V0TGVmdCArIG1hcFJlY3QucmlnaHQgLSA1O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC5ib3R0b20gPSBvZmZzZXRUb3AgKyBtYXBSZWN0LmJvdHRvbSAtIDE1O1xyXG4gICAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ2RyYWdnYWJsZTInLG5ld01hcFJlY3QpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgb2Zmc2V0VG9wID0gMDtcclxuICAgICAgICAgIG9mZnNldExlZnQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGFydFggPSBldmVudC5wYWdlWCAtIHggLSBvZmZzZXRMZWZ0O1xyXG4gICAgICAgIHN0YXJ0WSA9IGV2ZW50LnBhZ2VZIC0geSAtIG9mZnNldFRvcDtcclxuICAgICAgICBlbGVtZW50LmNzcyh7XHJcbiAgICAgICAgICBjdXJzb3I6ICctd2Via2l0LWdyYWJiaW5nJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcclxuICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3VzZW1vdmUoZXZlbnQpIHtcclxuICAgICAgICB5ID0gZXZlbnQucGFnZVkgLSBzdGFydFk7XHJcbiAgICAgICAgeCA9IGV2ZW50LnBhZ2VYIC0gc3RhcnRYO1xyXG5cclxuICAgICAgICBpZighaW5zaWRlTWFwKCkpIHtcclxuICAgICAgICAgIHRvb2xiYXIuY3NzKHtcclxuICAgICAgICAgICAgdG9wOiB5MSArICdweCcsXHJcbiAgICAgICAgICAgIGxlZnQ6IHgxICsgJ3B4J1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICB4MSA9IHg7XHJcbiAgICAgICAgICB5MSA9IHk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3VzZXVwKCkge1xyXG4gICAgICAgIGVsZW1lbnQuY3NzKHtcclxuICAgICAgICAgIGN1cnNvcjogJy13ZWJraXQtZ3JhYidcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZG9jdW1lbnQub2ZmKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xyXG4gICAgICAgICRkb2N1bWVudC5vZmYoJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gaW5zaWRlTWFwKCl7XHJcbiAgICAgICAgdG9vbGJhci5jc3Moe1xyXG4gICAgICAgICAgdG9wOiB5ICsgJ3B4JyxcclxuICAgICAgICAgIGxlZnQ6IHggKyAncHgnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGlmKGVsZW1SZWN0LnRvcCA8IG5ld01hcFJlY3QudG9wIHx8IGVsZW1SZWN0LmxlZnQgPCBuZXdNYXBSZWN0LmxlZnQgfHwgZWxlbVJlY3QucmlnaHQgPiBuZXdNYXBSZWN0LnJpZ2h0IHx8IGVsZW1SZWN0LmJvdHRvbSA+IG5ld01hcFJlY3QuYm90dG9tKXtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfV0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBlcmV6eSBvbiAwMS8wMi8xNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sYmFyJywgZnVuY3Rpb24oKSB7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHRlbXBsYXRlIDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyXCIgPjxkaXYgY2xhc3M9XCJkcmFnLWJ1dHRvbiBnbHlwaGljb24gZ2x5cGhpY29uLW1pbnVzXCIgZHJhZ2dhYmxlPjwvZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcclxuICAgIHRyYW5zY2x1ZGUgOiB0cnVlLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgbGV0IGN1cnJlbnRUb29sID0gbnVsbDtcclxuXHJcbiAgICAgIHRoaXMuZ2V0Q2VzaXVtV2lkZ2V0ID0gKCkgPT4gJHNjb3BlLmdldENlc2l1bVdpZGdldCgpO1xyXG5cclxuICAgICAgdGhpcy5zdGFydFRvb2wgPSBmdW5jdGlvbih0b29sKXtcclxuICAgICAgICBpZihjdXJyZW50VG9vbCAhPT0gbnVsbCl7XHJcbiAgICAgICAgICBjdXJyZW50VG9vbC5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdXJyZW50VG9vbCA9IHRvb2w7XHJcbiAgICAgICAgY3VycmVudFRvb2wuc3RhcnQoKTtcclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCl7XHJcbiAgICAgICAgc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0ID0gbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ2lsbmlzMiBvbiAxOC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdwb2x5bGluZXNMYXllcicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBzY29wZSA6IHt9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldFBvbHlsaW5lQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY29sbGVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICAgIHNjb3BlLmNvbGxlY3Rpb24gPSBuZXcgQ2VzaXVtLlBvbHlsaW5lQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5hZGQoc2NvcGUuY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd3ZWJNYXBTZXJ2aWNlTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIHVybCA6ICcmJyxcclxuICAgICAgbGF5ZXJzIDogJyYnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgdmFyIHByb3ZpZGVyID0gbmV3IENlc2l1bS5XZWJNYXBTZXJ2aWNlSW1hZ2VyeVByb3ZpZGVyKHtcclxuICAgICAgICB1cmw6IHNjb3BlLnVybCgpLFxyXG4gICAgICAgIGxheWVycyA6IHNjb3BlLmxheWVycygpXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGxheWVyID0gbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLmFkZEltYWdlcnlQcm92aWRlcihwcm92aWRlcik7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLnJlbW92ZShsYXllcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAyLzAyLzE1LlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ1pvb21Ub29sJywgWydUb29sJyxcclxuICAgIGZ1bmN0aW9uKFRvb2wpe1xyXG5cclxuICAgICAgY2xhc3MgWm9vbVRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihtYXApe1xyXG4gICAgICAgICAgdGhpcy5fY2FtZXJhID0gbWFwLnNjZW5lLmNhbWVyYTtcclxuICAgICAgICAgIHRoaXMuX2VsbGlwc29pZCA9IG1hcC5zY2VuZS5nbG9iZS5lbGxpcHNvaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGFydCgpeyBjb25zb2xlLmxvZygnRXhhbXAtVG9vbCBzdGFydCEnKTsgfVxyXG5cclxuICAgICAgICBzdG9wKCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcblxyXG4gICAgICAgIGNhbmNlbCgpeyBjb25zb2xlLmxvZygnRXhhbXAtVG9vbCBzdGFydCEnKTsgfVxyXG5cclxuICAgICAgICBvblVwZGF0ZSgpeyBjb25zb2xlLmxvZygnRXhhbXAtVG9vbCBzdGFydCEnKTsgfVxyXG5cclxuICAgICAgICB6b29tSW4oanVtcHMpe1xyXG4gICAgICAgICAganVtcHMgPSBOdW1iZXIuaXNGaW5pdGUoanVtcHMpID8ganVtcHMgOiAxO1xyXG4gICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGp1bXBzOyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgY2FtZXJhSGVpZ2h0ID0gdGhpcy5fZWxsaXBzb2lkLmNhcnRlc2lhblRvQ2FydG9ncmFwaGljKHRoaXMuX2NhbWVyYS5wb3NpdGlvbikuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgbW92ZVJhdGUgPSBjYW1lcmFIZWlnaHQgLyAxMDAuMDtcclxuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLm1vdmVGb3J3YXJkKG1vdmVSYXRlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHpvb21PdXQoanVtcHMpe1xyXG4gICAgICAgICAganVtcHMgPSBOdW1iZXIuaXNGaW5pdGUoanVtcHMpID8ganVtcHMgOiAxO1xyXG4gICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGp1bXBzOyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgY2FtZXJhSGVpZ2h0ID0gdGhpcy5fZWxsaXBzb2lkLmNhcnRlc2lhblRvQ2FydG9ncmFwaGljKHRoaXMuX2NhbWVyYS5wb3NpdGlvbikuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgbW92ZVJhdGUgPSBjYW1lcmFIZWlnaHQgLyAxMDAuMDtcclxuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLm1vdmVCYWNrd2FyZChtb3ZlUmF0ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gWm9vbVRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAyLzAyLzE1LlxuICovXG5cbihmdW5jdGlvbihhbmd1bGFyKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3pvb21XaWRnZXQnLCBbJyRkb2N1bWVudCcsXG4gICAgZnVuY3Rpb24oJGRvY3VtZW50KXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmU6ICdedG9vbCcsXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInpvb20td2lkZ2V0XCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiem9vbS1pbi1idG5cIj4nICtcbiAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgbmctY2xpY2s9XCJ6b29tSW4oKTtcIj4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi16b29tLWluXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xuICAgICAgICAnPC9idXR0b24+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJzbGlkZXJcIj4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiYmFyXCI+JyArXG4gICAgICAgICc8L3NwYW4+JyArXG4gICAgICAgICc8c3BhbiBjbGFzcz1cInBvaW50ZXJcIj4nICtcbiAgICAgICAgJzwvc3Bhbj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInpvb20tb3V0LWJ0blwiPicgK1xuICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBuZy1jbGljaz1cInpvb21PdXQoKTtcIj4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi16b29tLW91dFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcbiAgICAgICAgJzwvYnV0dG9uPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xDdHJsKXtcbiAgICAgICAgICBpZihpc0Zpbml0ZShhdHRycy53aWR0aCkgfHwgaXNGaW5pdGUoYXR0cnMuaGVpZ2h0KSl7XG4gICAgICAgICAgICBsZXQgd2lkdGggPSAgaXNGaW5pdGUoYXR0cnMud2lkdGgpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLndpZHRoKSArICdweCcgOiAnaW5oZXJpdCc7XG4gICAgICAgICAgICBsZXQgaGVpZ2h0ID0gIGlzRmluaXRlKGF0dHJzLmhlaWdodCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMuaGVpZ2h0KSArICdweCcgOiAnaW5oZXJpdCc7XG4gICAgICAgICAgICBlbGVtZW50LmNzcyh7cG9zaXRpb246ICdyZWxhdGl2ZScsIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgbWluTGV2ZWwgPSBpc0Zpbml0ZShhdHRycy5taW4pID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1pbikgOiAwO1xuICAgICAgICAgIGxldCBtYXhMZXZlbCA9IGlzRmluaXRlKGF0dHJzLm1heCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMubWF4KSA6IDEwMDtcblxuICAgICAgICAgIGlmKG1pbkxldmVsIDwgMCB8fCBtYXhMZXZlbCA8IDAgfHwgbWluTGV2ZWwgPj0gbWF4TGV2ZWwpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibWluIG9yIG1heCBhdHRyaWJ1dGVzIHZhbHVlIGFyZSBpbnZhbGlkLlwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQganVtcHMgPSBpc0Zpbml0ZShhdHRycy5qdW1wKSA/IE51bWJlci5wYXJzZUludChhdHRycy5qdW1wKSA6IDEwO1xuXG4gICAgICAgICAgbGV0IHpvb21Ub29sID0gdG9vbEN0cmwuZ2V0VG9vbCgpO1xuXG4gICAgICAgICAgaWYoKHR5cGVvZiB6b29tVG9vbC56b29tSW4gIT09ICdmdW5jdGlvbicpIHx8ICh0eXBlb2Ygem9vbVRvb2wuem9vbU91dCAhPT0gJ2Z1bmN0aW9uJykpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlpvb20gd2lkZ2V0IG11c3QgYmUgaW5zaWRlIHRvb2wgd2l0aCBab29tVG9vbCB0eXBlLlwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgbGV2ZWxWYWx1ZSA9IDkwIC8gKG1heExldmVsIC0gbWluTGV2ZWwpO1xuICAgICAgICAgIGxldCBjdXJyZW50TGV2ZWwgPSAobWF4TGV2ZWwgLSBtaW5MZXZlbCkgLyAyO1xuICAgICAgICAgIGxldCB6b29tTGV2ZWwgPSAobWF4TGV2ZWwgKyBtaW5MZXZlbCkgLyAyO1xuICAgICAgICAgIGxldCB0ZW1wTGV2ZWwgPSB6b29tTGV2ZWw7XG4gICAgICAgICAgbGV0IGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gNDU7XG5cbiAgICAgICAgICBsZXQgcG9pbnRlciAgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudC5maW5kKCdzcGFuJylbMl0pO1xuICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlICsgJyUnKTtcblxuICAgICAgICAgIGxldCBjbGllbnRZID0gbnVsbDtcbiAgICAgICAgICBsZXQgYmFySGVpZ2h0ID0gcG9pbnRlclswXS5jbGllbnRIZWlnaHQgKiAxMDtcbiAgICAgICAgICBsZXQgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XG5cbiAgICAgICAgICBwb2ludGVyLm9uKCdtb3VzZWRvd24nLCBldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgICAgICBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcbiAgICAgICAgICAgIHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcbiAgICAgICAgICAgIHBvaW50ZXIuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZXVwJywgZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYoY2xpZW50WSAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgIGNsaWVudFkgPSBudWxsO1xuICAgICAgICAgICAgICBwb2ludGVyLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYoY2xpZW50WSAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgIGxldCBkZWx0YVkgPSBjbGllbnRZIC0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgICAgICAgbGV0IHBlcmNlbnQgPSAoTWF0aC5hYnMoZGVsdGFZKSAqIDEwMCAvIGJhckhlaWdodCk7XG5cbiAgICAgICAgICAgICAgaWYoZGVsdGFZID4gMCl7XG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudCA+PSAwKXtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudDtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGlmKHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQgPD0gOTApe1xuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBzdGFydFBvaW50ZXJIZWlnaHQgKyBwZXJjZW50O1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSA5MDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwgPSBNYXRoLnRydW5jKGN1cnJlbnRQb2ludGVySGVpZ2h0IC8gbGV2ZWxWYWx1ZSk7XG4gICAgICAgICAgICAgIHpvb21MZXZlbCA9IG1heExldmVsIC0gY3VycmVudExldmVsO1xuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPiB0ZW1wTGV2ZWwpe1xuICAgICAgICAgICAgICAgIHpvb21Ub29sLnpvb21Jbigoem9vbUxldmVsIC0gdGVtcExldmVsKSAqIGp1bXBzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPCB0ZW1wTGV2ZWwpe1xuICAgICAgICAgICAgICAgIHpvb21Ub29sLnpvb21PdXQoKHRlbXBMZXZlbCAtIHpvb21MZXZlbCkgKiBqdW1wcyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGVtcExldmVsID0gem9vbUxldmVsO1xuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudExldmVsICogbGV2ZWxWYWx1ZSArICclJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBzY29wZS56b29tSW4gPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYoem9vbUxldmVsIDwgbWF4TGV2ZWwpe1xuICAgICAgICAgICAgICB6b29tTGV2ZWwrKztcbiAgICAgICAgICAgICAgY3VycmVudExldmVsLS07XG4gICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRQb2ludGVySGVpZ2h0ICsgJyUnKTtcbiAgICAgICAgICAgICAgem9vbVRvb2wuem9vbUluKGp1bXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgc2NvcGUuem9vbU91dCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZih6b29tTGV2ZWwgPiBtaW5MZXZlbCl7XG4gICAgICAgICAgICAgIHpvb21MZXZlbC0tO1xuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwrKztcbiAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlO1xuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudFBvaW50ZXJIZWlnaHQgKyAnJScpO1xuICAgICAgICAgICAgICB6b29tVG9vbC56b29tT3V0KGp1bXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbn0od2luZG93LmFuZ3VsYXIpKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
