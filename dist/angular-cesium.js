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
      }}
  };
});
//# sourceURL=map-components/map/map-directive.js
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
    var mapRect = scope.mapRect,
        newMapRect = {},
        elemRect = {};
    console.log(mapRect);
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
        scope.mapRect = angular.element(scope.getCesiumWidget().container)[0].getBoundingClientRect();
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
            console.log(zoomLevel);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Rvb2wuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmQvYmlsbGJvYXJkLmpzIiwibWFwLWNvbXBvbmVudHMvYmlsbGJvYXJkcy1sYXllci9iaWxsYm9hcmRzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvY29tcGxleC1sYXllci9jb21wbGV4LWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbGFiZWwvbGFiZWwuanMiLCJtYXAtY29tcG9uZW50cy9tYXAvbWFwLWRpcmVjdGl2ZS5qcyIsIm1hcC1jb21wb25lbnRzL2xhYmVscy1sYXllci9sYWJlbHMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9wb2x5bGluZS9wb2x5bGluZS5qcyIsIm1hcC1jb21wb25lbnRzL3BvbHlsaW5lcy1sYXllci9wb2x5bGluZXMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29sL3Rvb2wtYmFyLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC5kcnYuanMiLCJtYXAtY29tcG9uZW50cy90b29sYmFyL2RyYWdnYWJsZS5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xiYXIvdG9vbGJhci5qcyIsIm1hcC1jb21wb25lbnRzL3dlYi1tYXAtc2VydmljZS1sYXllci93ZWItbWFwLXNlcnZpY2UtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tL3pvb20tdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS13aWRnZXQuZHJ2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYW5ndWxhci1jZXNpdW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nLCBbJ29ic2VydmFibGVDb2xsZWN0aW9uJ10pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTAvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLnNlcnZpY2UoJ0JpbGxCb2FyZEF0dHJpYnV0ZXMnLCBmdW5jdGlvbigkcGFyc2UpIHtcclxuICB0aGlzLmNhbGNBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMsIGNvbnRleHQpIHtcclxuICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgIGltYWdlIDogJHBhcnNlKGF0dHJzLmltYWdlKShjb250ZXh0KVxyXG4gICAgfTtcclxuICAgIHZhciBwb3NpdGlvbkF0dHIgPSAkcGFyc2UoYXR0cnMucG9zaXRpb24pKGNvbnRleHQpO1xyXG4gICAgcmVzdWx0LnBvc2l0aW9uID0gQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uQXR0ci5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uQXR0ci5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIuYWx0aXR1ZGUpIHx8IDApO1xyXG5cclxuICAgIHZhciBjb2xvciA9ICRwYXJzZShhdHRycy5jb2xvcikoY29udGV4dCk7XHJcbiAgICBpZiAoY29sb3IpIHtcclxuICAgICAgcmVzdWx0LmNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZyhjb2xvcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdDZXNpdW0nLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gQ2VzaXVtO1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdUb29sJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgIGNsYXNzIFRvb2wge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKG1hcCl7IHRoaXMuX21hcCA9IG1hcDsgfVxyXG4gICAgICAgIHN0YXJ0KCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxyXG4gICAgICAgIHN0b3AoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiOyB9XHJcbiAgICAgICAgY2FuY2VsKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjt9XHJcbiAgICAgICAgb25VcGRhdGUoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFRvb2w7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkJywgZnVuY3Rpb24oQmlsbEJvYXJkQXR0cmlidXRlcykge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmJpbGxib2FyZHNMYXllcicsXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBiaWxsYm9hcmRzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBiaWxsRGVzYyA9IEJpbGxCb2FyZEF0dHJpYnV0ZXMuY2FsY0F0dHJpYnV0ZXMoYXR0cnMsIHNjb3BlKTtcclxuXHJcbiAgICAgIHZhciBiaWxsYm9hcmQgPSBiaWxsYm9hcmRzTGF5ZXJDdHJsLmdldEJpbGxib2FyZENvbGxlY3Rpb24oKS5hZGQoYmlsbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLnJlbW92ZShiaWxsYm9hcmQpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2JpbGxib2FyZHNMYXllcicsIGZ1bmN0aW9uKCRwYXJzZSwgT2JzZXJ2YWJsZUNvbGxlY3Rpb24sIEJpbGxCb2FyZEF0dHJpYnV0ZXMsIENlc2l1bSkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlLCAkYXR0cnMpIHtcclxuICAgICAgdGhpcy5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCRhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZ2V0IGNvbGxlY3Rpb24gaWYgbGF5ZXIgaXMgYm91bmQgdG8gT2JzZXJ2YWJsZUNvbGxlY3Rpb24nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY29sbGVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICAgIHNjb3BlLmNvbGxlY3Rpb24gPSBuZXcgQ2VzaXVtLkJpbGxib2FyZENvbGxlY3Rpb24oKTtcclxuICAgICAgICBpZiAoYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgIHZhciBDT0xMRUNUSU9OX1JFR0VYUCA9IC9cXHMqKFtcXCRcXHddW1xcJFxcd10qKVxccytpblxccysoW1xcJFxcd11bXFwkXFx3XSopLztcclxuICAgICAgICAgIHZhciBtYXRjaCA9IGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uLm1hdGNoKENPTExFQ1RJT05fUkVHRVhQKTtcclxuICAgICAgICAgIHZhciBpdGVtTmFtZSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgdmFyIGNvbGxlY3Rpb24gPSAkcGFyc2UobWF0Y2hbMl0pKHNjb3BlKTtcclxuICAgICAgICAgIGlmICghY29sbGVjdGlvbiBpbnN0YW5jZW9mIE9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb2JzZXJ2YWJsZS1jb2xsZWN0aW9uIG11c3QgYmUgb2YgdHlwZSBPYnNlcnZhYmxlQ29sbGVjdGlvbi4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYWRkQmlsbGJvYXJkID0gZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgIHZhciBjb250ZXh0ID0ge307XHJcbiAgICAgICAgICAgICAgY29udGV4dFtpdGVtTmFtZV0gPSBpdGVtO1xyXG4gICAgICAgICAgICAgIHZhciBiaWxsRGVzYyA9IEJpbGxCb2FyZEF0dHJpYnV0ZXMuY2FsY0F0dHJpYnV0ZXMoYXR0cnMsIGNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICBzY29wZS5jb2xsZWN0aW9uLmFkZChiaWxsRGVzYyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY29sbGVjdGlvbi5nZXREYXRhKCksIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICBhZGRCaWxsYm9hcmQoaXRlbSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25BZGQoYWRkQmlsbGJvYXJkKTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vblVwZGF0ZShmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25SZW1vdmUoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgICBzY29wZS5jb2xsZWN0aW9uLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uLmdldChpbmRleCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5hZGQoc2NvcGUuY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxNy8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdjb21wbGV4TGF5ZXInLCBmdW5jdGlvbigkbG9nKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbXBpbGUgOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xyXG4gICAgICBpZiAoYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudC5jaGlsZHJlbigpLCBmdW5jdGlvbiAoY2hpbGQpIHtcclxuXHJcbiAgICAgICAgICB2YXIgbGF5ZXIgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgaWYgKGNoaWxkLnRhZ05hbWUgPT09ICdCSUxMQk9BUkQnKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gYW5ndWxhci5lbGVtZW50KCc8YmlsbGJvYXJkcy1sYXllcj48L2JpbGxib2FyZHMtbGF5ZXI+Jyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmIChjaGlsZC50YWdOYW1lID09PSAnTEFCRUwnKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gYW5ndWxhci5lbGVtZW50KCc8bGFiZWxzLWxheWVyPjwvbGFiZWxzLWxheWVyPicpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICghbGF5ZXIpIHtcclxuICAgICAgICAgICAgJGxvZy53YXJuKCdGb3VuZCBhbiB1bmtub3duIGNoaWxkIG9mIG9mIGNvbXBsZXgtbGF5ZXIuIFJlbW92aW5nLi4uJyk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChjaGlsZCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNoaWxkLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdHRyKSB7XHJcbiAgICAgICAgICAgICAgbGF5ZXIuYXR0cihhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnRbMF0uYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcclxuICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZWxlbWVudChjaGlsZCkuYXR0cihhdHRyLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBsYXllci5hdHRyKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGNoaWxkKS5yZXBsYWNlV2l0aChsYXllcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbGFiZWwnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15sYWJlbHNMYXllcicsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgY29sb3IgOiAnJicsXHJcbiAgICAgIHRleHQgOiAnJicsXHJcbiAgICAgIHBvc2l0aW9uIDogJyYnXHJcbiAgICB9LFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbGFiZWxzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBsYWJlbERlc2MgPSB7fTtcclxuXHJcbiAgICAgIHZhciBwb3NpdGlvbiA9IHNjb3BlLnBvc2l0aW9uKCk7XHJcbiAgICAgIGxhYmVsRGVzYy5wb3NpdGlvbiA9IENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbi5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmxvbmdpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmFsdGl0dWRlKSB8fCAwKTtcclxuXHJcbiAgICAgIHZhciBjb2xvciA9IHNjb3BlLmNvbG9yKCk7XHJcbiAgICAgIGlmIChjb2xvcikge1xyXG4gICAgICAgIGxhYmVsRGVzYy5jb2xvciA9IGNvbG9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsYWJlbERlc2MudGV4dCA9IHNjb3BlLnRleHQoKTtcclxuXHJcbiAgICAgIHZhciBsYWJlbCA9IGxhYmVsc0xheWVyQ3RybC5nZXRMYWJlbENvbGxlY3Rpb24oKS5hZGQobGFiZWxEZXNjKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBsYWJlbHNMYXllckN0cmwuZ2V0TGFiZWxDb2xsZWN0aW9uKCkucmVtb3ZlKGxhYmVsKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ21hcCcsIGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBnZXRTY2VuZU1vZGUoZGltZW5zaW9ucykge1xuICAgIGlmIChkaW1lbnNpb25zID09IDIpIHtcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FMkQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGRpbWVuc2lvbnMgPT0gMi41KSB7XG4gICAgICByZXR1cm4gQ2VzaXVtLlNjZW5lTW9kZS5DT0xVTUJVU19WSUVXO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FM0Q7XG4gICAgfVxuICB9XG5cblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgIHRlbXBsYXRlIDogJzxkaXY+IDxuZy10cmFuc2NsdWRlPjwvbmctdHJhbnNjbHVkZT4gPGRpdiBjbGFzcz1cIm1hcC1jb250YWluZXJcIj48L2Rpdj4gPC9kaXY+JyxcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcbiAgICBzY29wZSA6IHtcbiAgICAgIGRpbWVuc2lvbnMgOiAnQCdcbiAgICB9LFxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgIHRoaXMuZ2V0Q2VzaXVtV2lkZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkc2NvcGUuY2VzaXVtO1xuICAgICAgfTtcbiAgICAgICRzY29wZS5vbkRyb3AgPSBmdW5jdGlvbihldmVudCl7XG5cbiAgICAgIH07XG4gICAgfSxcbiAgICBsaW5rIDoge1xuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKCFzY29wZS5kaW1lbnNpb25zKSB7XG4gICAgICAgICAgc2NvcGUuZGltZW5zaW9ucyA9IDM7XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5jZXNpdW0gPSBuZXcgQ2VzaXVtLkNlc2l1bVdpZGdldChlbGVtZW50LmZpbmQoJ2RpdicpWzBdLCB7XG4gICAgICAgICAgc2NlbmVNb2RlOiBnZXRTY2VuZU1vZGUoc2NvcGUuZGltZW5zaW9ucylcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7XG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsc0xheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge30sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuZ2V0TGFiZWxDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uTGFiZWxDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBnaWxuaXMyIG9uIDE4LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3BvbHlsaW5lJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdecG9seWxpbmVzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB3aWR0aCA6ICcmJyxcclxuICAgICAgcG9zaXRpb25zIDogJyYnXHJcbiAgICB9LFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgcG9seWxpbmVzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBwb2x5bGluZURlc2MgPSB7fTtcclxuXHJcbiAgICAgIGlmICghYW5ndWxhci5pc0RlZmluZWQoc2NvcGUucG9zaXRpb25zKSB8fCAhYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLnBvc2l0aW9ucykpe1xyXG4gICAgICAgIHRocm93IFwiUG9seWxpbmUgcG9zaXRpb25zIG11c3QgYmUgZGVmaW5lZCBhcyBhIGZ1bmN0aW9uXCI7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHBvc2l0aW9ucyA9IHNjb3BlLnBvc2l0aW9ucygpO1xyXG4gICAgICBwb2x5bGluZURlc2MucG9zaXRpb25zID0gW107XHJcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChwb3NpdGlvbnMsIGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcG9seWxpbmVEZXNjLnBvc2l0aW9ucy5wdXNoKENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbi5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmxvbmdpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmFsdGl0dWRlKSB8fCAwKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNlc2l1bUNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZygnYmxhY2snKTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLmNvbG9yKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUuY29sb3IpKXtcclxuICAgICAgICBjZXNpdW1Db2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoc2NvcGUuY29sb3IoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICBwb2x5bGluZURlc2MubWF0ZXJpYWwgPSBDZXNpdW0uTWF0ZXJpYWwuZnJvbVR5cGUoJ0NvbG9yJyk7XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5tYXRlcmlhbC51bmlmb3Jtcy5jb2xvciA9IGNlc2l1bUNvbG9yO1xyXG5cclxuICAgICAgcG9seWxpbmVEZXNjLndpZHRoID0gMTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLndpZHRoKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUud2lkdGgpKXtcclxuICAgICAgICBwb2x5bGluZURlc2Mud2lkdGggPSBzY29wZS53aWR0aCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcG9seWxpbmUgPSBwb2x5bGluZXNMYXllckN0cmwuZ2V0UG9seWxpbmVDb2xsZWN0aW9uKCkuYWRkKHBvbHlsaW5lRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcG9seWxpbmVzTGF5ZXJDdHJsLmdldFBvbHlsaW5lQ29sbGVjdGlvbigpLnJlbW92ZShwb2x5bGluZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmVzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRQb2x5bGluZUNvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5Qb2x5bGluZUNvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sQmFyJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXF1aXJlOiAnXm1hcCcsXHJcbiAgICAgICAgLy90cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgIC8vdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU9XCJcIj48L2Rpdj4nLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJyxcclxuICAgICAgICAgIGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbGluazoge1xyXG4gICAgICAgICAgcHJlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpe1xyXG4gICAgICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sJywgWydUb29sJyxcclxuICAgIGZ1bmN0aW9uKFRvb2wpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZTogJ150b29sYmFyJyxcclxuICAgICAgICB0cmFuc2NsdWRlOiAnZWxlbWVudCcsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgIHR5cGU6ICc9J1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLFxyXG4gICAgICAgICAgZnVuY3Rpb24oJHNjb3BlKXtcclxuICAgICAgICAgICAgdGhpcy5nZXRUb29sID0gKCkgPT4gJHNjb3BlLnRvb2w7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBjb21waWxlOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB0b29sQmFyQ3RybCwgbGlua2VyKXtcclxuICAgICAgICAgICAgaWYoISh0eXBlb2Ygc2NvcGUudHlwZSA9PT0gJ2Z1bmN0aW9uJykpe1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0eXBlIGF0dHIgbXVzdCBiZSBjb25zdHJ1Y3Rvci5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB0b29sID0gbmV3IHNjb3BlLnR5cGUodG9vbEJhckN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkpO1xyXG5cclxuICAgICAgICAgICAgaWYoISh0b29sIGluc3RhbmNlb2YgVG9vbCkpe1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0b29sIG11c3QgYmUgaW5zdGFuY2Ugb2YgVG9vbC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBwcm94eSA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZm9yKGxldCBrZXkgaW4gdG9vbCl7XHJcbiAgICAgICAgICAgICAgaWYoa2V5ID09PSAnc3RhcnQnKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksIGtleSwge1xyXG4gICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiB0b29sW2tleV0sXHJcbiAgICAgICAgICAgICAgICBzZXQ6IHZhbCA9PiB7IHRvb2xba2V5XSA9IHZhbDsgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksICdzdGFydCcsIHtcclxuICAgICAgICAgICAgICBnZXQ6ICgpID0+ICgpID0+IHRvb2xCYXJDdHJsLnN0YXJ0VG9vbCh0b29sKVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLnRvb2wgPSBwcm94eTtcclxuXHJcbiAgICAgICAgICAgIGxpbmtlcihzY29wZSwgKGNsb25lKSA9PiB7XHJcbiAgICAgICAgICAgICAgZWxlbWVudC5wYXJlbnQoKS5hcHBlbmQoY2xvbmUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBlcmV6eSBvbiAyLzEvMjAxNS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpXG4gIC5kaXJlY3RpdmUoJ2RyYWdnYWJsZScsIFsnJGRvY3VtZW50JywgZnVuY3Rpb24oJGRvY3VtZW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG4gICAgICB2YXIgc3RhcnRYID0gMCwgc3RhcnRZID0gMCwgeCA9IDAsIHkgPSAwLCAgeDEgPSAwLCB5MSA9IDAsIG9mZnNldFRvcCA9IC0xLG9mZnNldExlZnQgPSAtMTtcbiAgICAgIHZhciBtYXBSZWN0ID0gc2NvcGUubWFwUmVjdCxuZXdNYXBSZWN0ID0ge30sIGVsZW1SZWN0ID0ge307Y29uc29sZS5sb2cobWFwUmVjdClcbiAgICAgIHZhciB0b29sYmFyID0gZWxlbWVudC5wYXJlbnQoKTtcbiAgICAgIGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdCBkcmFnZ2luZyBvZiBzZWxlY3RlZCBjb250ZW50XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmKG9mZnNldFRvcCA9PSAtMSl7XG4gICAgICAgICAgb2Zmc2V0VG9wID0gdG9vbGJhclswXS5vZmZzZXRUb3A7XG4gICAgICAgICAgb2Zmc2V0TGVmdCA9IHRvb2xiYXJbMF0ub2Zmc2V0TGVmdDtcbiAgICAgICAgICBuZXdNYXBSZWN0LnRvcCA9IG9mZnNldFRvcCArIG1hcFJlY3QudG9wO1xuICAgICAgICAgIG5ld01hcFJlY3QubGVmdCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LmxlZnQ7XG4gICAgICAgICAgbmV3TWFwUmVjdC5yaWdodCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LnJpZ2h0IC0gNTtcbiAgICAgICAgICBuZXdNYXBSZWN0LmJvdHRvbSA9IG9mZnNldFRvcCArIG1hcFJlY3QuYm90dG9tIC0gMTU7XG4gICAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdkcmFnZ2FibGUyJyxuZXdNYXBSZWN0KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgb2Zmc2V0VG9wID0gMDtcbiAgICAgICAgICBvZmZzZXRMZWZ0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBzdGFydFggPSBldmVudC5wYWdlWCAtIHggLSBvZmZzZXRMZWZ0O1xuICAgICAgICBzdGFydFkgPSBldmVudC5wYWdlWSAtIHkgLSBvZmZzZXRUb3A7XG4gICAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICBjdXJzb3I6ICctd2Via2l0LWdyYWJiaW5nJ1xuICAgICAgICB9KTtcbiAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xuICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBtb3VzZXVwKTtcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBtb3VzZW1vdmUoZXZlbnQpIHtcbiAgICAgICAgeSA9IGV2ZW50LnBhZ2VZIC0gc3RhcnRZO1xuICAgICAgICB4ID0gZXZlbnQucGFnZVggLSBzdGFydFg7XG5cbiAgICAgICAgaWYoIWluc2lkZU1hcCgpKSB7XG4gICAgICAgICAgdG9vbGJhci5jc3Moe1xuICAgICAgICAgICAgdG9wOiB5MSArICdweCcsXG4gICAgICAgICAgICBsZWZ0OiB4MSArICdweCdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgeDEgPSB4O1xuICAgICAgICAgIHkxID0geTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtb3VzZXVwKCkge1xuICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgY3Vyc29yOiAnLXdlYmtpdC1ncmFiJ1xuICAgICAgICB9KTtcbiAgICAgICAgJGRvY3VtZW50Lm9mZignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcbiAgICAgICAgJGRvY3VtZW50Lm9mZignbW91c2V1cCcsIG1vdXNldXApO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBpbnNpZGVNYXAoKXtcbiAgICAgICAgdG9vbGJhci5jc3Moe1xuICAgICAgICAgIHRvcDogeSArICdweCcsXG4gICAgICAgICAgbGVmdDogeCArICdweCdcbiAgICAgICAgfSk7XG4gICAgICAgIGVsZW1SZWN0ID0gdG9vbGJhclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgaWYoZWxlbVJlY3QudG9wIDwgbmV3TWFwUmVjdC50b3AgfHwgZWxlbVJlY3QubGVmdCA8IG5ld01hcFJlY3QubGVmdCB8fCBlbGVtUmVjdC5yaWdodCA+IG5ld01hcFJlY3QucmlnaHQgfHwgZWxlbVJlY3QuYm90dG9tID4gbmV3TWFwUmVjdC5ib3R0b20pe1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgZXJlenkgb24gMDEvMDIvMTUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2xiYXInLCBmdW5jdGlvbigpIHtcblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgIHRlbXBsYXRlIDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyXCIgPjxkaXYgY2xhc3M9XCJkcmFnLWJ1dHRvbiBnbHlwaGljb24gZ2x5cGhpY29uLW1pbnVzXCIgZHJhZ2dhYmxlPjwvZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcbiAgICByZXF1aXJlIDogJ15tYXAnLFxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgIGxldCBjdXJyZW50VG9vbCA9IG51bGw7XG5cbiAgICAgIHRoaXMuZ2V0Q2VzaXVtV2lkZ2V0ID0gKCkgPT4gJHNjb3BlLmdldENlc2l1bVdpZGdldCgpO1xuXG4gICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xuICAgICAgICBpZihjdXJyZW50VG9vbCAhPT0gbnVsbCl7XG4gICAgICAgICAgY3VycmVudFRvb2wuc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudFRvb2wgPSB0b29sO1xuICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xuICAgICAgfTtcbiAgICB9LFxuICAgIGxpbmsgOiB7XG4gICAgICBwcmU6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCl7XG4gICAgICAgIHNjb3BlLmdldENlc2l1bVdpZGdldCA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0O1xuICAgICAgICBzY29wZS5tYXBSZWN0ID0gYW5ndWxhci5lbGVtZW50KHNjb3BlLmdldENlc2l1bVdpZGdldCgpLmNvbnRhaW5lcilbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7XG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3dlYk1hcFNlcnZpY2VMYXllcicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgdXJsIDogJyYnLFxyXG4gICAgICBsYXllcnMgOiAnJidcclxuICAgIH0sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICB9LFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICB2YXIgcHJvdmlkZXIgPSBuZXcgQ2VzaXVtLldlYk1hcFNlcnZpY2VJbWFnZXJ5UHJvdmlkZXIoe1xyXG4gICAgICAgIHVybDogc2NvcGUudXJsKCksXHJcbiAgICAgICAgbGF5ZXJzIDogc2NvcGUubGF5ZXJzKClcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgbGF5ZXIgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLmltYWdlcnlMYXllcnMuYWRkSW1hZ2VyeVByb3ZpZGVyKHByb3ZpZGVyKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLmltYWdlcnlMYXllcnMucmVtb3ZlKGxheWVyKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDIvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnWm9vbVRvb2wnLCBbJ1Rvb2wnLFxyXG4gICAgZnVuY3Rpb24oVG9vbCl7XHJcblxyXG4gICAgICBjbGFzcyBab29tVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKG1hcCl7XHJcbiAgICAgICAgICB0aGlzLl9jYW1lcmEgPSBtYXAuc2NlbmUuY2FtZXJhO1xyXG4gICAgICAgICAgdGhpcy5fZWxsaXBzb2lkID0gbWFwLnNjZW5lLmdsb2JlLmVsbGlwc29pZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXJ0KCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcblxyXG4gICAgICAgIHN0b3AoKXsgY29uc29sZS5sb2coJ0V4YW1wLVRvb2wgc3RhcnQhJyk7IH1cclxuXHJcbiAgICAgICAgY2FuY2VsKCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcblxyXG4gICAgICAgIG9uVXBkYXRlKCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcblxyXG4gICAgICAgIHpvb21JbihqdW1wcyl7XHJcbiAgICAgICAgICBqdW1wcyA9IE51bWJlci5pc0Zpbml0ZShqdW1wcykgPyBqdW1wcyA6IDE7XHJcbiAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwganVtcHM7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjYW1lcmFIZWlnaHQgPSB0aGlzLl9lbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpcy5fY2FtZXJhLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEubW92ZUZvcndhcmQobW92ZVJhdGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgem9vbU91dChqdW1wcyl7XHJcbiAgICAgICAgICBqdW1wcyA9IE51bWJlci5pc0Zpbml0ZShqdW1wcykgPyBqdW1wcyA6IDE7XHJcbiAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwganVtcHM7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjYW1lcmFIZWlnaHQgPSB0aGlzLl9lbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpcy5fY2FtZXJhLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEubW92ZUJhY2t3YXJkKG1vdmVSYXRlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBab29tVG9vbDtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMi8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3pvb21XaWRnZXQnLCBbJyRkb2N1bWVudCcsXHJcbiAgICBmdW5jdGlvbigkZG9jdW1lbnQpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZTogJ150b29sJyxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJ6b29tLXdpZGdldFwiPicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiem9vbS1pbi1idG5cIj4nICtcclxuICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBuZy1jbGljaz1cInpvb21JbigpO1wiPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1pblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcclxuICAgICAgICAnPC9idXR0b24+JyArXHJcbiAgICAgICAgJzwvZGl2PicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic2xpZGVyXCI+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiYmFyXCI+JyArXHJcbiAgICAgICAgJzwvc3Bhbj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJwb2ludGVyXCI+JyArXHJcbiAgICAgICAgJzwvc3Bhbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJ6b29tLW91dC1idG5cIj4nICtcclxuICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBuZy1jbGljaz1cInpvb21PdXQoKTtcIj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXpvb20tb3V0XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xyXG4gICAgICAgICc8L2J1dHRvbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzwvZGl2PicsXHJcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB0b29sQ3RybCl7XHJcbiAgICAgICAgICBpZihpc0Zpbml0ZShhdHRycy53aWR0aCkgfHwgaXNGaW5pdGUoYXR0cnMuaGVpZ2h0KSl7XHJcbiAgICAgICAgICAgIGxldCB3aWR0aCA9ICBpc0Zpbml0ZShhdHRycy53aWR0aCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMud2lkdGgpICsgJ3B4JyA6ICdpbmhlcml0JztcclxuICAgICAgICAgICAgbGV0IGhlaWdodCA9ICBpc0Zpbml0ZShhdHRycy5oZWlnaHQpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLmhlaWdodCkgKyAncHgnIDogJ2luaGVyaXQnO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNzcyh7cG9zaXRpb246ICdyZWxhdGl2ZScsIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgbWluTGV2ZWwgPSBpc0Zpbml0ZShhdHRycy5taW4pID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1pbikgOiAwO1xyXG4gICAgICAgICAgbGV0IG1heExldmVsID0gaXNGaW5pdGUoYXR0cnMubWF4KSA/IE51bWJlci5wYXJzZUludChhdHRycy5tYXgpIDogMTAwO1xyXG5cclxuICAgICAgICAgIGlmKG1pbkxldmVsIDwgMCB8fCBtYXhMZXZlbCA8IDAgfHwgbWluTGV2ZWwgPj0gbWF4TGV2ZWwpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtaW4gb3IgbWF4IGF0dHJpYnV0ZXMgdmFsdWUgYXJlIGludmFsaWQuXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBqdW1wcyA9IGlzRmluaXRlKGF0dHJzLmp1bXApID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLmp1bXApIDogMTA7XHJcblxyXG4gICAgICAgICAgbGV0IHpvb21Ub29sID0gdG9vbEN0cmwuZ2V0VG9vbCgpO1xyXG5cclxuICAgICAgICAgIGxldCBsZXZlbFZhbHVlID0gOTAgLyAobWF4TGV2ZWwgLSBtaW5MZXZlbCk7XHJcbiAgICAgICAgICBsZXQgY3VycmVudExldmVsID0gKG1heExldmVsIC0gbWluTGV2ZWwpIC8gMjtcclxuICAgICAgICAgIGxldCB6b29tTGV2ZWwgPSAobWF4TGV2ZWwgKyBtaW5MZXZlbCkgLyAyO1xyXG4gICAgICAgICAgbGV0IHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcclxuICAgICAgICAgIGxldCBjdXJyZW50UG9pbnRlckhlaWdodCA9IDQ1O1xyXG5cclxuICAgICAgICAgIGxldCBwb2ludGVyICA9IGFuZ3VsYXIuZWxlbWVudChlbGVtZW50LmZpbmQoJ3NwYW4nKVsyXSk7XHJcbiAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudExldmVsICogbGV2ZWxWYWx1ZSArICclJyk7XHJcblxyXG4gICAgICAgICAgbGV0IGNsaWVudFkgPSBudWxsO1xyXG4gICAgICAgICAgbGV0IGJhckhlaWdodCA9IHBvaW50ZXJbMF0uY2xpZW50SGVpZ2h0ICogMTA7XHJcbiAgICAgICAgICBsZXQgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgcG9pbnRlci5vbignbW91c2Vkb3duJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICAgICAgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcclxuICAgICAgICAgICAgcG9pbnRlci5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNsaWVudFkgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgIGNsaWVudFkgPSBudWxsO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHpvb21MZXZlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZihjbGllbnRZICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICBsZXQgZGVsdGFZID0gY2xpZW50WSAtIGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgICAgICAgbGV0IHBlcmNlbnQgPSAoTWF0aC5hYnMoZGVsdGFZKSAqIDEwMCAvIGJhckhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgIGlmKGRlbHRhWSA+IDApe1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudCA+PSAwKXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBzdGFydFBvaW50ZXJIZWlnaHQgLSBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGlmKHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQgPD0gOTApe1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSA5MDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbCA9IE1hdGgudHJ1bmMoY3VycmVudFBvaW50ZXJIZWlnaHQgLyBsZXZlbFZhbHVlKTtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwgPSBtYXhMZXZlbCAtIGN1cnJlbnRMZXZlbDtcclxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPiB0ZW1wTGV2ZWwpe1xyXG4gICAgICAgICAgICAgICAgem9vbVRvb2wuem9vbUluKCh6b29tTGV2ZWwgLSB0ZW1wTGV2ZWwpICoganVtcHMpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPCB0ZW1wTGV2ZWwpe1xyXG4gICAgICAgICAgICAgICAgem9vbVRvb2wuem9vbU91dCgodGVtcExldmVsIC0gem9vbUxldmVsKSAqIGp1bXBzKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGVtcExldmVsID0gem9vbUxldmVsO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlICsgJyUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgc2NvcGUuem9vbUluID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoem9vbUxldmVsIDwgbWF4TGV2ZWwpe1xyXG4gICAgICAgICAgICAgIHpvb21MZXZlbCsrO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbC0tO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcclxuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudFBvaW50ZXJIZWlnaHQgKyAnJScpO1xyXG4gICAgICAgICAgICAgIHpvb21Ub29sLnpvb21JbihqdW1wcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuem9vbU91dCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHpvb21MZXZlbCA+IG1pbkxldmVsKXtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwtLTtcclxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwrKztcclxuICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWU7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRQb2ludGVySGVpZ2h0ICsgJyUnKTtcclxuICAgICAgICAgICAgICB6b29tVG9vbC56b29tT3V0KGp1bXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==