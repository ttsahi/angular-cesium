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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Rvb2wuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmQvYmlsbGJvYXJkLmpzIiwibWFwLWNvbXBvbmVudHMvYmlsbGJvYXJkcy1sYXllci9iaWxsYm9hcmRzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbGFiZWwvbGFiZWwuanMiLCJtYXAtY29tcG9uZW50cy9sYWJlbHMtbGF5ZXIvbGFiZWxzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbWFwL21hcC1kaXJlY3RpdmUuanMiLCJtYXAtY29tcG9uZW50cy9wb2x5bGluZS9wb2x5bGluZS5qcyIsIm1hcC1jb21wb25lbnRzL3BvbHlsaW5lcy1sYXllci9wb2x5bGluZXMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29sL3Rvb2wtYmFyLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC5kcnYuanMiLCJtYXAtY29tcG9uZW50cy90b29sYmFyL2RyYWdnYWJsZS5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xiYXIvdG9vbGJhci5qcyIsIm1hcC1jb21wb25lbnRzL2NvbXBsZXgtbGF5ZXIvY29tcGxleC1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL3dlYi1tYXAtc2VydmljZS1sYXllci93ZWItbWFwLXNlcnZpY2UtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tL3pvb20tdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS13aWRnZXQuZHJ2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbmd1bGFyLWNlc2l1bS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTAvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScsIFsnb2JzZXJ2YWJsZUNvbGxlY3Rpb24nXSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuc2VydmljZSgnQmlsbEJvYXJkQXR0cmlidXRlcycsIGZ1bmN0aW9uKCRwYXJzZSkge1xyXG4gIHRoaXMuY2FsY0F0dHJpYnV0ZXMgPSBmdW5jdGlvbihhdHRycywgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgaW1hZ2UgOiAkcGFyc2UoYXR0cnMuaW1hZ2UpKGNvbnRleHQpXHJcbiAgICB9O1xyXG4gICAgdmFyIHBvc2l0aW9uQXR0ciA9ICRwYXJzZShhdHRycy5wb3NpdGlvbikoY29udGV4dCk7XHJcbiAgICByZXN1bHQucG9zaXRpb24gPSBDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb25BdHRyLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb25BdHRyLmxvbmdpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uQXR0ci5hbHRpdHVkZSkgfHwgMCk7XHJcblxyXG4gICAgdmFyIGNvbG9yID0gJHBhcnNlKGF0dHJzLmNvbG9yKShjb250ZXh0KTtcclxuICAgIGlmIChjb2xvcikge1xyXG4gICAgICByZXN1bHQuY29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKGNvbG9yKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTAvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ0Nlc2l1bScsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBDZXNpdW07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAxLzAyLzE1LlxyXG4gKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmZhY3RvcnkoJ1Rvb2wnLCBbXHJcbiAgICBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgY2xhc3MgVG9vbCB7XHJcbiAgICAgICAgY29uc3RydWN0b3IobWFwKXsgdGhpcy5fbWFwID0gbWFwOyB9XHJcbiAgICAgICAgc3RhcnQoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiOyB9XHJcbiAgICAgICAgc3RvcCgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7IH1cclxuICAgICAgICBjYW5jZWwoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cclxuICAgICAgICBvblVwZGF0ZSgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7fVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gVG9vbDtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdiaWxsYm9hcmQnLCBmdW5jdGlvbihCaWxsQm9hcmRBdHRyaWJ1dGVzKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdeYmlsbGJvYXJkc0xheWVyJyxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGJpbGxib2FyZHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgc2NvcGUpO1xyXG5cclxuICAgICAgdmFyIGJpbGxib2FyZCA9IGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLmFkZChiaWxsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgYmlsbGJvYXJkc0xheWVyQ3RybC5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uKCkucmVtb3ZlKGJpbGxib2FyZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkc0xheWVyJywgZnVuY3Rpb24oJHBhcnNlLCBPYnNlcnZhYmxlQ29sbGVjdGlvbiwgQmlsbEJvYXJkQXR0cmlidXRlcywgQ2VzaXVtKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUsICRhdHRycykge1xyXG4gICAgICB0aGlzLmdldEJpbGxib2FyZENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoJGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBnZXQgY29sbGVjdGlvbiBpZiBsYXllciBpcyBib3VuZCB0byBPYnNlcnZhYmxlQ29sbGVjdGlvbicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uQmlsbGJvYXJkQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgdmFyIENPTExFQ1RJT05fUkVHRVhQID0gL1xccyooW1xcJFxcd11bXFwkXFx3XSopXFxzK2luXFxzKyhbXFwkXFx3XVtcXCRcXHddKikvO1xyXG4gICAgICAgICAgdmFyIG1hdGNoID0gYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24ubWF0Y2goQ09MTEVDVElPTl9SRUdFWFApO1xyXG4gICAgICAgICAgdmFyIGl0ZW1OYW1lID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICB2YXIgY29sbGVjdGlvbiA9ICRwYXJzZShtYXRjaFsyXSkoc2NvcGUpO1xyXG4gICAgICAgICAgaWYgKCFjb2xsZWN0aW9uIGluc3RhbmNlb2YgT2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvYnNlcnZhYmxlLWNvbGxlY3Rpb24gbXVzdCBiZSBvZiB0eXBlIE9ic2VydmFibGVDb2xsZWN0aW9uLicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhZGRCaWxsYm9hcmQgPSBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICAgICAgICBjb250ZXh0W2l0ZW1OYW1lXSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgdmFyIGJpbGxEZXNjID0gQmlsbEJvYXJkQXR0cmlidXRlcy5jYWxjQXR0cmlidXRlcyhhdHRycywgY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24uYWRkKGJpbGxEZXNjKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb2xsZWN0aW9uLmdldERhdGEoKSwgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgIGFkZEJpbGxib2FyZChpdGVtKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vbkFkZChhZGRCaWxsYm9hcmQpO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uVXBkYXRlKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5vblJlbW92ZShmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgIHNjb3BlLmNvbGxlY3Rpb24ucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24uZ2V0KGluZGV4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebGFiZWxzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB0ZXh0IDogJyYnLFxyXG4gICAgICBwb3NpdGlvbiA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGxhYmVsc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgbGFiZWxEZXNjID0ge307XHJcblxyXG4gICAgICB2YXIgcG9zaXRpb24gPSBzY29wZS5wb3NpdGlvbigpO1xyXG4gICAgICBsYWJlbERlc2MucG9zaXRpb24gPSBDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCk7XHJcblxyXG4gICAgICB2YXIgY29sb3IgPSBzY29wZS5jb2xvcigpO1xyXG4gICAgICBpZiAoY29sb3IpIHtcclxuICAgICAgICBsYWJlbERlc2MuY29sb3IgPSBjb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGFiZWxEZXNjLnRleHQgPSBzY29wZS50ZXh0KCk7XHJcblxyXG4gICAgICB2YXIgbGFiZWwgPSBsYWJlbHNMYXllckN0cmwuZ2V0TGFiZWxDb2xsZWN0aW9uKCkuYWRkKGxhYmVsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLnJlbW92ZShsYWJlbCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbGFiZWxzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRMYWJlbENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5MYWJlbENvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbWFwJywgZnVuY3Rpb24oKSB7XHJcbiAgZnVuY3Rpb24gZ2V0U2NlbmVNb2RlKGRpbWVuc2lvbnMpIHtcclxuICAgIGlmIChkaW1lbnNpb25zID09IDIpIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUyRDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGRpbWVuc2lvbnMgPT0gMi41KSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLkNPTFVNQlVTX1ZJRVc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUzRDtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICB0ZW1wbGF0ZSA6ICc8ZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+IDxkaXYgY2xhc3M9XCJtYXAtY29udGFpbmVyXCI+PC9kaXY+IDwvZGl2PicsXHJcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBkaW1lbnNpb25zIDogJ0AnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY2VzaXVtO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUub25Ecm9wID0gZnVuY3Rpb24oZXZlbnQpe1xyXG5cclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xyXG4gICAgICAgIGlmICghc2NvcGUuZGltZW5zaW9ucykge1xyXG4gICAgICAgICAgc2NvcGUuZGltZW5zaW9ucyA9IDM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY29wZS5jZXNpdW0gPSBuZXcgQ2VzaXVtLkNlc2l1bVdpZGdldChlbGVtZW50LmZpbmQoJ2RpdicpWzBdLCB7XHJcbiAgICAgICAgICBzY2VuZU1vZGU6IGdldFNjZW5lTW9kZShzY29wZS5kaW1lbnNpb25zKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmUnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15wb2x5bGluZXNMYXllcicsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgY29sb3IgOiAnJicsXHJcbiAgICAgIHdpZHRoIDogJyYnLFxyXG4gICAgICBwb3NpdGlvbnMgOiAnJidcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBwb2x5bGluZXNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIHBvbHlsaW5lRGVzYyA9IHt9O1xyXG5cclxuICAgICAgaWYgKCFhbmd1bGFyLmlzRGVmaW5lZChzY29wZS5wb3NpdGlvbnMpIHx8ICFhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUucG9zaXRpb25zKSl7XHJcbiAgICAgICAgdGhyb3cgXCJQb2x5bGluZSBwb3NpdGlvbnMgbXVzdCBiZSBkZWZpbmVkIGFzIGEgZnVuY3Rpb25cIjtcclxuICAgICAgfVxyXG4gICAgICB2YXIgcG9zaXRpb25zID0gc2NvcGUucG9zaXRpb25zKCk7XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5wb3NpdGlvbnMgPSBbXTtcclxuICAgICAgYW5ndWxhci5mb3JFYWNoKHBvc2l0aW9ucywgZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgICAgICBwb2x5bGluZURlc2MucG9zaXRpb25zLnB1c2goQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24ubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24uYWx0aXR1ZGUpIHx8IDApKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY2VzaXVtQ29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKCdibGFjaycpO1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2NvcGUuY29sb3IpICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS5jb2xvcikpe1xyXG4gICAgICAgIGNlc2l1bUNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZyhzY29wZS5jb2xvcigpKTtcclxuICAgICAgICB9XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5tYXRlcmlhbCA9IENlc2l1bS5NYXRlcmlhbC5mcm9tVHlwZSgnQ29sb3InKTtcclxuICAgICAgcG9seWxpbmVEZXNjLm1hdGVyaWFsLnVuaWZvcm1zLmNvbG9yID0gY2VzaXVtQ29sb3I7XHJcblxyXG4gICAgICBwb2x5bGluZURlc2Mud2lkdGggPSAxO1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2NvcGUud2lkdGgpICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS53aWR0aCkpe1xyXG4gICAgICAgIHBvbHlsaW5lRGVzYy53aWR0aCA9IHNjb3BlLndpZHRoKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBwb2x5bGluZSA9IHBvbHlsaW5lc0xheWVyQ3RybC5nZXRQb2x5bGluZUNvbGxlY3Rpb24oKS5hZGQocG9seWxpbmVEZXNjKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBwb2x5bGluZXNMYXllckN0cmwuZ2V0UG9seWxpbmVDb2xsZWN0aW9uKCkucmVtb3ZlKHBvbHlsaW5lKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ2lsbmlzMiBvbiAxOC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdwb2x5bGluZXNMYXllcicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBzY29wZSA6IHt9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldFBvbHlsaW5lQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY29sbGVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICAgIHNjb3BlLmNvbGxlY3Rpb24gPSBuZXcgQ2VzaXVtLlBvbHlsaW5lQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5hZGQoc2NvcGUuY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2xCYXInLCBbXHJcbiAgICBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcXVpcmU6ICdebWFwJyxcclxuICAgICAgICAvL3RyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgLy90ZW1wbGF0ZTogJzxkaXYgbmctdHJhbnNjbHVkZT1cIlwiPjwvZGl2PicsXHJcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLFxyXG4gICAgICAgICAgZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50VG9vbCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9ICgpID0+ICRzY29wZS5nZXRDZXNpdW1XaWRnZXQoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRUb29sID0gZnVuY3Rpb24odG9vbCl7XHJcbiAgICAgICAgICAgICAgaWYoY3VycmVudFRvb2wgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFRvb2wuc3RvcCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY3VycmVudFRvb2wgPSB0b29sO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0YXJ0KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBsaW5rOiB7XHJcbiAgICAgICAgICBwcmU6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCl7XHJcbiAgICAgICAgICAgIHNjb3BlLmdldENlc2l1bVdpZGdldCA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2wnLCBbJ1Rvb2wnLFxyXG4gICAgZnVuY3Rpb24oVG9vbCl7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlOiAnXnRvb2xiYXInLFxyXG4gICAgICAgIHRyYW5zY2x1ZGU6ICdlbGVtZW50JyxcclxuICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgdHlwZTogJz0nXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsXHJcbiAgICAgICAgICBmdW5jdGlvbigkc2NvcGUpe1xyXG4gICAgICAgICAgICB0aGlzLmdldFRvb2wgPSAoKSA9PiAkc2NvcGUudG9vbDtcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGNvbXBpbGU6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xCYXJDdHJsLCBsaW5rZXIpe1xyXG4gICAgICAgICAgICBpZighKHR5cGVvZiBzY29wZS50eXBlID09PSAnZnVuY3Rpb24nKSl7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInR5cGUgYXR0ciBtdXN0IGJlIGNvbnN0cnVjdG9yLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHRvb2wgPSBuZXcgc2NvcGUudHlwZSh0b29sQmFyQ3RybC5nZXRDZXNpdW1XaWRnZXQoKSk7XHJcblxyXG4gICAgICAgICAgICBpZighKHRvb2wgaW5zdGFuY2VvZiBUb29sKSl7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRvb2wgbXVzdCBiZSBpbnN0YW5jZSBvZiBUb29sLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHByb3h5ID0ge307XHJcblxyXG4gICAgICAgICAgICBmb3IobGV0IGtleSBpbiB0b29sKXtcclxuICAgICAgICAgICAgICBpZihrZXkgPT09ICdzdGFydCcpe1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwga2V5LCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IHRvb2xba2V5XSxcclxuICAgICAgICAgICAgICAgIHNldDogdmFsID0+IHsgdG9vbFtrZXldID0gdmFsOyB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwgJ3N0YXJ0Jywge1xyXG4gICAgICAgICAgICAgIGdldDogKCkgPT4gKCkgPT4gdG9vbEJhckN0cmwuc3RhcnRUb29sKHRvb2wpXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc2NvcGUudG9vbCA9IHByb3h5O1xyXG5cclxuICAgICAgICAgICAgbGlua2VyKHNjb3BlLCAoY2xvbmUpID0+IHtcclxuICAgICAgICAgICAgICBlbGVtZW50LnBhcmVudCgpLmFwcGVuZChjbG9uZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGVyZXp5IG9uIDIvMS8yMDE1LlxuICovXG4ndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJylcbiAgLmRpcmVjdGl2ZSgnZHJhZ2dhYmxlJywgWyckZG9jdW1lbnQnLCBmdW5jdGlvbigkZG9jdW1lbnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcbiAgICAgIHZhciBzdGFydFggPSAwLCBzdGFydFkgPSAwLCB4ID0gMCwgeSA9IDAsICB4MSA9IDAsIHkxID0gMCwgb2Zmc2V0VG9wID0gLTEsb2Zmc2V0TGVmdCA9IC0xO1xuICAgICAgdmFyIG1hcFJlY3QgPSBzY29wZS5tYXBSZWN0LG5ld01hcFJlY3QgPSB7fSwgZWxlbVJlY3QgPSB7fTtcbiAgICAgIHZhciB0b29sYmFyID0gZWxlbWVudC5wYXJlbnQoKTtcbiAgICAgIGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdCBkcmFnZ2luZyBvZiBzZWxlY3RlZCBjb250ZW50XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmKG9mZnNldFRvcCA9PSAtMSl7XG4gICAgICAgICAgb2Zmc2V0VG9wID0gdG9vbGJhclswXS5vZmZzZXRUb3A7XG4gICAgICAgICAgb2Zmc2V0TGVmdCA9IHRvb2xiYXJbMF0ub2Zmc2V0TGVmdDtcbiAgICAgICAgICBuZXdNYXBSZWN0LnRvcCA9IG9mZnNldFRvcCArIG1hcFJlY3QudG9wO1xuICAgICAgICAgIG5ld01hcFJlY3QubGVmdCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LmxlZnQ7XG4gICAgICAgICAgbmV3TWFwUmVjdC5yaWdodCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LnJpZ2h0IC0gNTtcbiAgICAgICAgICBuZXdNYXBSZWN0LmJvdHRvbSA9IG9mZnNldFRvcCArIG1hcFJlY3QuYm90dG9tIC0gMTU7XG4gICAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBvZmZzZXRUb3AgPSAwO1xuICAgICAgICAgIG9mZnNldExlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHN0YXJ0WCA9IGV2ZW50LnBhZ2VYIC0geCAtIG9mZnNldExlZnQ7XG4gICAgICAgIHN0YXJ0WSA9IGV2ZW50LnBhZ2VZIC0geSAtIG9mZnNldFRvcDtcbiAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgIGN1cnNvcjogJy13ZWJraXQtZ3JhYmJpbmcnXG4gICAgICAgIH0pO1xuICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNlbW92ZScsIG1vdXNlbW92ZSk7XG4gICAgICAgICRkb2N1bWVudC5vbignbW91c2V1cCcsIG1vdXNldXApO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIG1vdXNlbW92ZShldmVudCkge1xuICAgICAgICB5ID0gZXZlbnQucGFnZVkgLSBzdGFydFk7XG4gICAgICAgIHggPSBldmVudC5wYWdlWCAtIHN0YXJ0WDtcblxuICAgICAgICBpZighaW5zaWRlTWFwKCkpIHtcbiAgICAgICAgICB0b29sYmFyLmNzcyh7XG4gICAgICAgICAgICB0b3A6IHkxICsgJ3B4JyxcbiAgICAgICAgICAgIGxlZnQ6IHgxICsgJ3B4J1xuICAgICAgICAgIH0pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICB4MSA9IHg7XG4gICAgICAgICAgeTEgPSB5O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1vdXNldXAoKSB7XG4gICAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICBjdXJzb3I6ICctd2Via2l0LWdyYWInXG4gICAgICAgIH0pO1xuICAgICAgICAkZG9jdW1lbnQub2ZmKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xuICAgICAgICAkZG9jdW1lbnQub2ZmKCdtb3VzZXVwJywgbW91c2V1cCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGluc2lkZU1hcCgpe1xuICAgICAgICB0b29sYmFyLmNzcyh7XG4gICAgICAgICAgdG9wOiB5ICsgJ3B4JyxcbiAgICAgICAgICBsZWZ0OiB4ICsgJ3B4J1xuICAgICAgICB9KTtcbiAgICAgICAgZWxlbVJlY3QgPSB0b29sYmFyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBpZihlbGVtUmVjdC50b3AgPCBuZXdNYXBSZWN0LnRvcCB8fCBlbGVtUmVjdC5sZWZ0IDwgbmV3TWFwUmVjdC5sZWZ0IHx8IGVsZW1SZWN0LnJpZ2h0ID4gbmV3TWFwUmVjdC5yaWdodCB8fCBlbGVtUmVjdC5ib3R0b20gPiBuZXdNYXBSZWN0LmJvdHRvbSl7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH07XG4gIH1dKTtcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGVyZXp5IG9uIDAxLzAyLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2xiYXInLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdiBjbGFzcz1cInRvb2xiYXJcIiA+PGRpdiBjbGFzcz1cImRyYWctYnV0dG9uIGdseXBoaWNvbiBnbHlwaGljb24tbWludXNcIiBkcmFnZ2FibGU+PC9kaXY+IDxuZy10cmFuc2NsdWRlPjwvbmctdHJhbnNjbHVkZT48L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKXtcclxuICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgICBzY29wZS5tYXBSZWN0ID0gYW5ndWxhci5lbGVtZW50KHNjb3BlLmdldENlc2l1bVdpZGdldCgpLmNvbnRhaW5lcilbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxNy8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdjb21wbGV4TGF5ZXInLCBmdW5jdGlvbigkbG9nKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIGNvbXBpbGUgOiBmdW5jdGlvbihlbGVtZW50LCBhdHRycykge1xyXG4gICAgICBpZiAoYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudC5jaGlsZHJlbigpLCBmdW5jdGlvbiAoY2hpbGQpIHtcclxuXHJcbiAgICAgICAgICB2YXIgbGF5ZXIgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgaWYgKGNoaWxkLnRhZ05hbWUgPT09ICdCSUxMQk9BUkQnKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gYW5ndWxhci5lbGVtZW50KCc8YmlsbGJvYXJkcy1sYXllcj48L2JpbGxib2FyZHMtbGF5ZXI+Jyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmIChjaGlsZC50YWdOYW1lID09PSAnTEFCRUwnKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gYW5ndWxhci5lbGVtZW50KCc8bGFiZWxzLWxheWVyPjwvbGFiZWxzLWxheWVyPicpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICghbGF5ZXIpIHtcclxuICAgICAgICAgICAgJGxvZy53YXJuKCdGb3VuZCBhbiB1bmtub3duIGNoaWxkIG9mIG9mIGNvbXBsZXgtbGF5ZXIuIFJlbW92aW5nLi4uJyk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChjaGlsZCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNoaWxkLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdHRyKSB7XHJcbiAgICAgICAgICAgICAgbGF5ZXIuYXR0cihhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnRbMF0uYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcclxuICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZWxlbWVudChjaGlsZCkuYXR0cihhdHRyLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBsYXllci5hdHRyKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGNoaWxkKS5yZXBsYWNlV2l0aChsYXllcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnd2ViTWFwU2VydmljZUxheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICB1cmwgOiAnJicsXHJcbiAgICAgIGxheWVycyA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgIHZhciBwcm92aWRlciA9IG5ldyBDZXNpdW0uV2ViTWFwU2VydmljZUltYWdlcnlQcm92aWRlcih7XHJcbiAgICAgICAgdXJsOiBzY29wZS51cmwoKSxcclxuICAgICAgICBsYXllcnMgOiBzY29wZS5sYXllcnMoKVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBsYXllciA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5hZGRJbWFnZXJ5UHJvdmlkZXIocHJvdmlkZXIpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5yZW1vdmUobGF5ZXIpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMi8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdab29tVG9vbCcsIFsnVG9vbCcsXHJcbiAgICBmdW5jdGlvbihUb29sKXtcclxuXHJcbiAgICAgIGNsYXNzIFpvb21Ub29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICAgICAgY29uc3RydWN0b3IobWFwKXtcclxuICAgICAgICAgIHRoaXMuX2NhbWVyYSA9IG1hcC5zY2VuZS5jYW1lcmE7XHJcbiAgICAgICAgICB0aGlzLl9lbGxpcHNvaWQgPSBtYXAuc2NlbmUuZ2xvYmUuZWxsaXBzb2lkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhcnQoKXsgY29uc29sZS5sb2coJ0V4YW1wLVRvb2wgc3RhcnQhJyk7IH1cclxuXHJcbiAgICAgICAgc3RvcCgpeyBjb25zb2xlLmxvZygnRXhhbXAtVG9vbCBzdGFydCEnKTsgfVxyXG5cclxuICAgICAgICBjYW5jZWwoKXsgY29uc29sZS5sb2coJ0V4YW1wLVRvb2wgc3RhcnQhJyk7IH1cclxuXHJcbiAgICAgICAgb25VcGRhdGUoKXsgY29uc29sZS5sb2coJ0V4YW1wLVRvb2wgc3RhcnQhJyk7IH1cclxuXHJcbiAgICAgICAgem9vbUluKGp1bXBzKXtcclxuICAgICAgICAgIGp1bXBzID0gTnVtYmVyLmlzRmluaXRlKGp1bXBzKSA/IGp1bXBzIDogMTtcclxuICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBqdW1wczsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IGNhbWVyYUhlaWdodCA9IHRoaXMuX2VsbGlwc29pZC5jYXJ0ZXNpYW5Ub0NhcnRvZ3JhcGhpYyh0aGlzLl9jYW1lcmEucG9zaXRpb24pLmhlaWdodDtcclxuICAgICAgICAgICAgbGV0IG1vdmVSYXRlID0gY2FtZXJhSGVpZ2h0IC8gMTAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuX2NhbWVyYS5tb3ZlRm9yd2FyZChtb3ZlUmF0ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB6b29tT3V0KGp1bXBzKXtcclxuICAgICAgICAgIGp1bXBzID0gTnVtYmVyLmlzRmluaXRlKGp1bXBzKSA/IGp1bXBzIDogMTtcclxuICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBqdW1wczsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IGNhbWVyYUhlaWdodCA9IHRoaXMuX2VsbGlwc29pZC5jYXJ0ZXNpYW5Ub0NhcnRvZ3JhcGhpYyh0aGlzLl9jYW1lcmEucG9zaXRpb24pLmhlaWdodDtcclxuICAgICAgICAgICAgbGV0IG1vdmVSYXRlID0gY2FtZXJhSGVpZ2h0IC8gMTAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuX2NhbWVyYS5tb3ZlQmFja3dhcmQobW92ZVJhdGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFpvb21Ub29sO1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAyLzAyLzE1LlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnem9vbVdpZGdldCcsIFsnJGRvY3VtZW50JyxcclxuICAgIGZ1bmN0aW9uKCRkb2N1bWVudCl7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlOiAnXnRvb2wnLFxyXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInpvb20td2lkZ2V0XCI+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJ6b29tLWluLWJ0blwiPicgK1xyXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIG5nLWNsaWNrPVwiem9vbUluKCk7XCI+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi16b29tLWluXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xyXG4gICAgICAgICc8L2J1dHRvbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJzbGlkZXJcIj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJiYXJcIj4nICtcclxuICAgICAgICAnPC9zcGFuPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cInBvaW50ZXJcIj4nICtcclxuICAgICAgICAnPC9zcGFuPicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInpvb20tb3V0LWJ0blwiPicgK1xyXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIG5nLWNsaWNrPVwiem9vbU91dCgpO1wiPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1vdXRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXHJcbiAgICAgICAgJzwvYnV0dG9uPicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xDdHJsKXtcclxuICAgICAgICAgIGlmKGlzRmluaXRlKGF0dHJzLndpZHRoKSB8fCBpc0Zpbml0ZShhdHRycy5oZWlnaHQpKXtcclxuICAgICAgICAgICAgbGV0IHdpZHRoID0gIGlzRmluaXRlKGF0dHJzLndpZHRoKSA/IE51bWJlci5wYXJzZUludChhdHRycy53aWR0aCkgKyAncHgnIDogJ2luaGVyaXQnO1xyXG4gICAgICAgICAgICBsZXQgaGVpZ2h0ID0gIGlzRmluaXRlKGF0dHJzLmhlaWdodCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMuaGVpZ2h0KSArICdweCcgOiAnaW5oZXJpdCc7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtwb3NpdGlvbjogJ3JlbGF0aXZlJywgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBtaW5MZXZlbCA9IGlzRmluaXRlKGF0dHJzLm1pbikgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMubWluKSA6IDA7XHJcbiAgICAgICAgICBsZXQgbWF4TGV2ZWwgPSBpc0Zpbml0ZShhdHRycy5tYXgpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1heCkgOiAxMDA7XHJcblxyXG4gICAgICAgICAgaWYobWluTGV2ZWwgPCAwIHx8IG1heExldmVsIDwgMCB8fCBtaW5MZXZlbCA+PSBtYXhMZXZlbCl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm1pbiBvciBtYXggYXR0cmlidXRlcyB2YWx1ZSBhcmUgaW52YWxpZC5cIik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGV0IGp1bXBzID0gaXNGaW5pdGUoYXR0cnMuanVtcCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMuanVtcCkgOiAxMDtcclxuXHJcbiAgICAgICAgICBsZXQgem9vbVRvb2wgPSB0b29sQ3RybC5nZXRUb29sKCk7XHJcblxyXG4gICAgICAgICAgbGV0IGxldmVsVmFsdWUgPSA5MCAvIChtYXhMZXZlbCAtIG1pbkxldmVsKTtcclxuICAgICAgICAgIGxldCBjdXJyZW50TGV2ZWwgPSAobWF4TGV2ZWwgLSBtaW5MZXZlbCkgLyAyO1xyXG4gICAgICAgICAgbGV0IHpvb21MZXZlbCA9IChtYXhMZXZlbCArIG1pbkxldmVsKSAvIDI7XHJcbiAgICAgICAgICBsZXQgdGVtcExldmVsID0gem9vbUxldmVsO1xyXG4gICAgICAgICAgbGV0IGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gNDU7XHJcblxyXG4gICAgICAgICAgbGV0IHBvaW50ZXIgID0gYW5ndWxhci5lbGVtZW50KGVsZW1lbnQuZmluZCgnc3BhbicpWzJdKTtcclxuICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlICsgJyUnKTtcclxuXHJcbiAgICAgICAgICBsZXQgY2xpZW50WSA9IG51bGw7XHJcbiAgICAgICAgICBsZXQgYmFySGVpZ2h0ID0gcG9pbnRlclswXS5jbGllbnRIZWlnaHQgKiAxMDtcclxuICAgICAgICAgIGxldCBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcclxuXHJcbiAgICAgICAgICBwb2ludGVyLm9uKCdtb3VzZWRvd24nLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgICAgICBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcclxuICAgICAgICAgICAgdGVtcExldmVsID0gem9vbUxldmVsO1xyXG4gICAgICAgICAgICBwb2ludGVyLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2V1cCcsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgaWYoY2xpZW50WSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgY2xpZW50WSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coem9vbUxldmVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZW1vdmUnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNsaWVudFkgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgIGxldCBkZWx0YVkgPSBjbGllbnRZIC0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICAgICAgICBsZXQgcGVyY2VudCA9IChNYXRoLmFicyhkZWx0YVkpICogMTAwIC8gYmFySGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgaWYoZGVsdGFZID4gMCl7XHJcbiAgICAgICAgICAgICAgICBpZihzdGFydFBvaW50ZXJIZWlnaHQgLSBwZXJjZW50ID49IDApe1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IHN0YXJ0UG9pbnRlckhlaWdodCAtIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0ICsgcGVyY2VudCA8PSA5MCl7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gc3RhcnRQb2ludGVySGVpZ2h0ICsgcGVyY2VudDtcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IDkwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY3VycmVudExldmVsID0gTWF0aC50cnVuYyhjdXJyZW50UG9pbnRlckhlaWdodCAvIGxldmVsVmFsdWUpO1xyXG4gICAgICAgICAgICAgIHpvb21MZXZlbCA9IG1heExldmVsIC0gY3VycmVudExldmVsO1xyXG4gICAgICAgICAgICAgIGlmKHpvb21MZXZlbCA+IHRlbXBMZXZlbCl7XHJcbiAgICAgICAgICAgICAgICB6b29tVG9vbC56b29tSW4oKHpvb21MZXZlbCAtIHRlbXBMZXZlbCkgKiBqdW1wcyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmKHpvb21MZXZlbCA8IHRlbXBMZXZlbCl7XHJcbiAgICAgICAgICAgICAgICB6b29tVG9vbC56b29tT3V0KCh0ZW1wTGV2ZWwgLSB6b29tTGV2ZWwpICoganVtcHMpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB0ZW1wTGV2ZWwgPSB6b29tTGV2ZWw7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWUgKyAnJScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBzY29wZS56b29tSW4gPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZih6b29tTGV2ZWwgPCBtYXhMZXZlbCl7XHJcbiAgICAgICAgICAgICAgem9vbUxldmVsKys7XHJcbiAgICAgICAgICAgICAgY3VycmVudExldmVsLS07XHJcbiAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50UG9pbnRlckhlaWdodCArICclJyk7XHJcbiAgICAgICAgICAgICAgem9vbVRvb2wuem9vbUluKGp1bXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS56b29tT3V0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoem9vbUxldmVsID4gbWluTGV2ZWwpe1xyXG4gICAgICAgICAgICAgIHpvb21MZXZlbC0tO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbCsrO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcclxuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudFBvaW50ZXJIZWlnaHQgKyAnJScpO1xyXG4gICAgICAgICAgICAgIHpvb21Ub29sLnpvb21PdXQoanVtcHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9