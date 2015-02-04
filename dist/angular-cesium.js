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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Rvb2wuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmQvYmlsbGJvYXJkLmpzIiwibWFwLWNvbXBvbmVudHMvYmlsbGJvYXJkcy1sYXllci9iaWxsYm9hcmRzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvY29tcGxleC1sYXllci9jb21wbGV4LWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbGFiZWwvbGFiZWwuanMiLCJtYXAtY29tcG9uZW50cy9sYWJlbHMtbGF5ZXIvbGFiZWxzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbWFwL21hcC1kaXJlY3RpdmUuanMiLCJtYXAtY29tcG9uZW50cy9wb2x5bGluZXMtbGF5ZXIvcG9seWxpbmVzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvcG9seWxpbmUvcG9seWxpbmUuanMiLCJtYXAtY29tcG9uZW50cy90b29sL3Rvb2wtYmFyLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC5kcnYuanMiLCJtYXAtY29tcG9uZW50cy93ZWItbWFwLXNlcnZpY2UtbGF5ZXIvd2ViLW1hcC1zZXJ2aWNlLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbGJhci9kcmFnZ2FibGUuanMiLCJtYXAtY29tcG9uZW50cy90b29sYmFyL3Rvb2xiYXIuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tL3pvb20tdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS13aWRnZXQuZHJ2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFuZ3VsYXItY2VzaXVtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJywgWydvYnNlcnZhYmxlQ29sbGVjdGlvbiddKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5zZXJ2aWNlKCdCaWxsQm9hcmRBdHRyaWJ1dGVzJywgZnVuY3Rpb24oJHBhcnNlKSB7XHJcbiAgdGhpcy5jYWxjQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGF0dHJzLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBpbWFnZSA6ICRwYXJzZShhdHRycy5pbWFnZSkoY29udGV4dClcclxuICAgIH07XHJcbiAgICB2YXIgcG9zaXRpb25BdHRyID0gJHBhcnNlKGF0dHJzLnBvc2l0aW9uKShjb250ZXh0KTtcclxuICAgIHJlc3VsdC5wb3NpdGlvbiA9IENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbkF0dHIubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb25BdHRyLmFsdGl0dWRlKSB8fCAwKTtcclxuXHJcbiAgICB2YXIgY29sb3IgPSAkcGFyc2UoYXR0cnMuY29sb3IpKGNvbnRleHQpO1xyXG4gICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgIHJlc3VsdC5jb2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoY29sb3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnQ2VzaXVtJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIENlc2l1bTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnVG9vbCcsIFtcclxuICAgIGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICBjbGFzcyBUb29sIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihtYXApeyB0aGlzLl9tYXAgPSBtYXA7IH1cclxuICAgICAgICBzdGFydCgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7IH1cclxuICAgICAgICBzdG9wKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxyXG4gICAgICAgIGNhbmNlbCgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7fVxyXG4gICAgICAgIG9uVXBkYXRlKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjt9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBUb29sO1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2JpbGxib2FyZCcsIGZ1bmN0aW9uKEJpbGxCb2FyZEF0dHJpYnV0ZXMpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15iaWxsYm9hcmRzTGF5ZXInLFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgYmlsbGJvYXJkc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgYmlsbERlc2MgPSBCaWxsQm9hcmRBdHRyaWJ1dGVzLmNhbGNBdHRyaWJ1dGVzKGF0dHJzLCBzY29wZSk7XHJcblxyXG4gICAgICB2YXIgYmlsbGJvYXJkID0gYmlsbGJvYXJkc0xheWVyQ3RybC5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uKCkuYWRkKGJpbGxEZXNjKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBiaWxsYm9hcmRzTGF5ZXJDdHJsLmdldEJpbGxib2FyZENvbGxlY3Rpb24oKS5yZW1vdmUoYmlsbGJvYXJkKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdiaWxsYm9hcmRzTGF5ZXInLCBmdW5jdGlvbigkcGFyc2UsIE9ic2VydmFibGVDb2xsZWN0aW9uLCBCaWxsQm9hcmRBdHRyaWJ1dGVzLCBDZXNpdW0pIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSwgJGF0dHJzKSB7XHJcbiAgICAgIHRoaXMuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICgkYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGdldCBjb2xsZWN0aW9uIGlmIGxheWVyIGlzIGJvdW5kIHRvIE9ic2VydmFibGVDb2xsZWN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5CaWxsYm9hcmRDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgaWYgKGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICB2YXIgQ09MTEVDVElPTl9SRUdFWFAgPSAvXFxzKihbXFwkXFx3XVtcXCRcXHddKilcXHMraW5cXHMrKFtcXCRcXHddW1xcJFxcd10qKS87XHJcbiAgICAgICAgICB2YXIgbWF0Y2ggPSBhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbi5tYXRjaChDT0xMRUNUSU9OX1JFR0VYUCk7XHJcbiAgICAgICAgICB2YXIgaXRlbU5hbWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgIHZhciBjb2xsZWN0aW9uID0gJHBhcnNlKG1hdGNoWzJdKShzY29wZSk7XHJcbiAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24gaW5zdGFuY2VvZiBPYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ29ic2VydmFibGUtY29sbGVjdGlvbiBtdXN0IGJlIG9mIHR5cGUgT2JzZXJ2YWJsZUNvbGxlY3Rpb24uJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGFkZEJpbGxib2FyZCA9IGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHt9O1xyXG4gICAgICAgICAgICAgIGNvbnRleHRbaXRlbU5hbWVdID0gaXRlbTtcclxuICAgICAgICAgICAgICB2YXIgYmlsbERlc2MgPSBCaWxsQm9hcmRBdHRyaWJ1dGVzLmNhbGNBdHRyaWJ1dGVzKGF0dHJzLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgICAgc2NvcGUuY29sbGVjdGlvbi5hZGQoYmlsbERlc2MpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvbGxlY3Rpb24uZ2V0RGF0YSgpLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgYWRkQmlsbGJvYXJkKGl0ZW0pXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uQWRkKGFkZEJpbGxib2FyZCk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25VcGRhdGUoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uUmVtb3ZlKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgc2NvcGUuY29sbGVjdGlvbi5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbi5nZXQoaW5kZXgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTcvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnY29tcGxleExheWVyJywgZnVuY3Rpb24oJGxvZykge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb21waWxlIDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgaWYgKGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnQuY2hpbGRyZW4oKSwgZnVuY3Rpb24gKGNoaWxkKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGxheWVyID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgIGlmIChjaGlsZC50YWdOYW1lID09PSAnQklMTEJPQVJEJykge1xyXG4gICAgICAgICAgICBsYXllciA9IGFuZ3VsYXIuZWxlbWVudCgnPGJpbGxib2FyZHMtbGF5ZXI+PC9iaWxsYm9hcmRzLWxheWVyPicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoY2hpbGQudGFnTmFtZSA9PT0gJ0xBQkVMJykge1xyXG4gICAgICAgICAgICBsYXllciA9IGFuZ3VsYXIuZWxlbWVudCgnPGxhYmVscy1sYXllcj48L2xhYmVscy1sYXllcj4nKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIWxheWVyKSB7XHJcbiAgICAgICAgICAgICRsb2cud2FybignRm91bmQgYW4gdW5rbm93biBjaGlsZCBvZiBvZiBjb21wbGV4LWxheWVyLiBSZW1vdmluZy4uLicpO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjaGlsZC5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG4gICAgICAgICAgICAgIGxheWVyLmF0dHIoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50WzBdLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdHRyKSB7XHJcbiAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLmF0dHIoYXR0ci5uYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuYXR0cihhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChjaGlsZCkucmVwbGFjZVdpdGgobGF5ZXIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebGFiZWxzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB0ZXh0IDogJyYnLFxyXG4gICAgICBwb3NpdGlvbiA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGxhYmVsc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgbGFiZWxEZXNjID0ge307XHJcblxyXG4gICAgICB2YXIgcG9zaXRpb24gPSBzY29wZS5wb3NpdGlvbigpO1xyXG4gICAgICBsYWJlbERlc2MucG9zaXRpb24gPSBDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCk7XHJcblxyXG4gICAgICB2YXIgY29sb3IgPSBzY29wZS5jb2xvcigpO1xyXG4gICAgICBpZiAoY29sb3IpIHtcclxuICAgICAgICBsYWJlbERlc2MuY29sb3IgPSBjb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGFiZWxEZXNjLnRleHQgPSBzY29wZS50ZXh0KCk7XHJcblxyXG4gICAgICB2YXIgbGFiZWwgPSBsYWJlbHNMYXllckN0cmwuZ2V0TGFiZWxDb2xsZWN0aW9uKCkuYWRkKGxhYmVsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLnJlbW92ZShsYWJlbCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbGFiZWxzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRMYWJlbENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5MYWJlbENvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbWFwJywgZnVuY3Rpb24oKSB7XHJcbiAgZnVuY3Rpb24gZ2V0U2NlbmVNb2RlKGRpbWVuc2lvbnMpIHtcclxuICAgIGlmIChkaW1lbnNpb25zID09IDIpIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUyRDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGRpbWVuc2lvbnMgPT0gMi41KSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLkNPTFVNQlVTX1ZJRVc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUzRDtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICB0ZW1wbGF0ZSA6ICc8ZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+IDxkaXYgY2xhc3M9XCJtYXAtY29udGFpbmVyXCI+PC9kaXY+IDwvZGl2PicsXHJcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBkaW1lbnNpb25zIDogJ0AnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY2VzaXVtO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUub25Ecm9wID0gZnVuY3Rpb24oZXZlbnQpe1xyXG5cclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xyXG4gICAgICAgIGlmICghc2NvcGUuZGltZW5zaW9ucykge1xyXG4gICAgICAgICAgc2NvcGUuZGltZW5zaW9ucyA9IDM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY29wZS5jZXNpdW0gPSBuZXcgQ2VzaXVtLkNlc2l1bVdpZGdldChlbGVtZW50LmZpbmQoJ2RpdicpWzBdLCB7XHJcbiAgICAgICAgICBzY2VuZU1vZGU6IGdldFNjZW5lTW9kZShzY29wZS5kaW1lbnNpb25zKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNjb3BlLm1hcFJlY3QgPSBlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmVzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRQb2x5bGluZUNvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5Qb2x5bGluZUNvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmUnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15wb2x5bGluZXNMYXllcicsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgY29sb3IgOiAnJicsXHJcbiAgICAgIHdpZHRoIDogJyYnLFxyXG4gICAgICBwb3NpdGlvbnMgOiAnJidcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBwb2x5bGluZXNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIHBvbHlsaW5lRGVzYyA9IHt9O1xyXG5cclxuICAgICAgaWYgKCFhbmd1bGFyLmlzRGVmaW5lZChzY29wZS5wb3NpdGlvbnMpIHx8ICFhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUucG9zaXRpb25zKSl7XHJcbiAgICAgICAgdGhyb3cgXCJQb2x5bGluZSBwb3NpdGlvbnMgbXVzdCBiZSBkZWZpbmVkIGFzIGEgZnVuY3Rpb25cIjtcclxuICAgICAgfVxyXG4gICAgICB2YXIgcG9zaXRpb25zID0gc2NvcGUucG9zaXRpb25zKCk7XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5wb3NpdGlvbnMgPSBbXTtcclxuICAgICAgYW5ndWxhci5mb3JFYWNoKHBvc2l0aW9ucywgZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgICAgICBwb2x5bGluZURlc2MucG9zaXRpb25zLnB1c2goQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24ubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24uYWx0aXR1ZGUpIHx8IDApKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY2VzaXVtQ29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKCdibGFjaycpO1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2NvcGUuY29sb3IpICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS5jb2xvcikpe1xyXG4gICAgICAgIGNlc2l1bUNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZyhzY29wZS5jb2xvcigpKTtcclxuICAgICAgICB9XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5tYXRlcmlhbCA9IENlc2l1bS5NYXRlcmlhbC5mcm9tVHlwZSgnQ29sb3InKTtcclxuICAgICAgcG9seWxpbmVEZXNjLm1hdGVyaWFsLnVuaWZvcm1zLmNvbG9yID0gY2VzaXVtQ29sb3I7XHJcblxyXG4gICAgICBwb2x5bGluZURlc2Mud2lkdGggPSAxO1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2NvcGUud2lkdGgpICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS53aWR0aCkpe1xyXG4gICAgICAgIHBvbHlsaW5lRGVzYy53aWR0aCA9IHNjb3BlLndpZHRoKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBwb2x5bGluZSA9IHBvbHlsaW5lc0xheWVyQ3RybC5nZXRQb2x5bGluZUNvbGxlY3Rpb24oKS5hZGQocG9seWxpbmVEZXNjKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBwb2x5bGluZXNMYXllckN0cmwuZ2V0UG9seWxpbmVDb2xsZWN0aW9uKCkucmVtb3ZlKHBvbHlsaW5lKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2xCYXInLCBbXHJcbiAgICBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcXVpcmU6ICdebWFwJyxcclxuICAgICAgICAvL3RyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgLy90ZW1wbGF0ZTogJzxkaXYgbmctdHJhbnNjbHVkZT1cIlwiPjwvZGl2PicsXHJcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLFxyXG4gICAgICAgICAgZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50VG9vbCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9ICgpID0+ICRzY29wZS5nZXRDZXNpdW1XaWRnZXQoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRUb29sID0gZnVuY3Rpb24odG9vbCl7XHJcbiAgICAgICAgICAgICAgaWYoY3VycmVudFRvb2wgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFRvb2wuc3RvcCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY3VycmVudFRvb2wgPSB0b29sO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0YXJ0KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBsaW5rOiB7XHJcbiAgICAgICAgICBwcmU6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCl7XHJcbiAgICAgICAgICAgIHNjb3BlLmdldENlc2l1bVdpZGdldCA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2wnLCBbJ1Rvb2wnLFxyXG4gICAgZnVuY3Rpb24oVG9vbCl7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlOiAnXnRvb2xiYXInLFxyXG4gICAgICAgIHRyYW5zY2x1ZGU6ICdlbGVtZW50JyxcclxuICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgdHlwZTogJz0nXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsXHJcbiAgICAgICAgICBmdW5jdGlvbigkc2NvcGUpe1xyXG4gICAgICAgICAgICB0aGlzLmdldFRvb2wgPSAoKSA9PiAkc2NvcGUudG9vbDtcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGNvbXBpbGU6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xCYXJDdHJsLCBsaW5rZXIpe1xyXG4gICAgICAgICAgICBpZighKHR5cGVvZiBzY29wZS50eXBlID09PSAnZnVuY3Rpb24nKSl7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInR5cGUgYXR0ciBtdXN0IGJlIGNvbnN0cnVjdG9yLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHRvb2wgPSBuZXcgc2NvcGUudHlwZSh0b29sQmFyQ3RybC5nZXRDZXNpdW1XaWRnZXQoKSk7XHJcblxyXG4gICAgICAgICAgICBpZighKHRvb2wgaW5zdGFuY2VvZiBUb29sKSl7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRvb2wgbXVzdCBiZSBpbnN0YW5jZSBvZiBUb29sLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHByb3h5ID0ge307XHJcblxyXG4gICAgICAgICAgICBmb3IobGV0IGtleSBpbiB0b29sKXtcclxuICAgICAgICAgICAgICBpZihrZXkgPT09ICdzdGFydCcpe1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwga2V5LCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IHRvb2xba2V5XSxcclxuICAgICAgICAgICAgICAgIHNldDogdmFsID0+IHsgdG9vbFtrZXldID0gdmFsOyB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwgJ3N0YXJ0Jywge1xyXG4gICAgICAgICAgICAgIGdldDogKCkgPT4gKCkgPT4gdG9vbEJhckN0cmwuc3RhcnRUb29sKHRvb2wpXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc2NvcGUudG9vbCA9IHByb3h5O1xyXG5cclxuICAgICAgICAgICAgbGlua2VyKHNjb3BlLCAoY2xvbmUpID0+IHtcclxuICAgICAgICAgICAgICBlbGVtZW50LnBhcmVudCgpLmFwcGVuZChjbG9uZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd3ZWJNYXBTZXJ2aWNlTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIHVybCA6ICcmJyxcclxuICAgICAgbGF5ZXJzIDogJyYnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgdmFyIHByb3ZpZGVyID0gbmV3IENlc2l1bS5XZWJNYXBTZXJ2aWNlSW1hZ2VyeVByb3ZpZGVyKHtcclxuICAgICAgICB1cmw6IHNjb3BlLnVybCgpLFxyXG4gICAgICAgIGxheWVycyA6IHNjb3BlLmxheWVycygpXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGxheWVyID0gbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLmFkZEltYWdlcnlQcm92aWRlcihwcm92aWRlcik7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5pbWFnZXJ5TGF5ZXJzLnJlbW92ZShsYXllcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBlcmV6eSBvbiAyLzEvMjAxNS5cclxuICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJylcclxuICAuZGlyZWN0aXZlKCdkcmFnZ2FibGUnLCBbJyRkb2N1bWVudCcsIGZ1bmN0aW9uKCRkb2N1bWVudCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XHJcbiAgICAgIHZhciBzdGFydFggPSAwLCBzdGFydFkgPSAwLCB4ID0gMCwgeSA9IDAsICB4MSA9IDAsIHkxID0gMCwgb2Zmc2V0VG9wID0gLTEsb2Zmc2V0TGVmdCA9IC0xO1xyXG4gICAgICB2YXIgbWFwUmVjdCA9IHNjb3BlLiRwYXJlbnQubWFwUmVjdCxuZXdNYXBSZWN0ID0ge30sIGVsZW1SZWN0ID0ge307XHJcbiAgICAgIHZhciB0b29sYmFyID0gZWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgZWxlbWVudC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAvLyBQcmV2ZW50IGRlZmF1bHQgZHJhZ2dpbmcgb2Ygc2VsZWN0ZWQgY29udGVudFxyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaWYob2Zmc2V0VG9wID09IC0xKXtcclxuICAgICAgICAgIG9mZnNldFRvcCA9IHRvb2xiYXJbMF0ub2Zmc2V0VG9wO1xyXG4gICAgICAgICAgb2Zmc2V0TGVmdCA9IHRvb2xiYXJbMF0ub2Zmc2V0TGVmdDtcclxuICAgICAgICAgIG5ld01hcFJlY3QudG9wID0gb2Zmc2V0VG9wICsgbWFwUmVjdC50b3A7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LmxlZnQgPSBvZmZzZXRMZWZ0ICsgbWFwUmVjdC5sZWZ0O1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC5yaWdodCA9IG9mZnNldExlZnQgKyBtYXBSZWN0LnJpZ2h0IC0gNTtcclxuICAgICAgICAgIG5ld01hcFJlY3QuYm90dG9tID0gb2Zmc2V0VG9wICsgbWFwUmVjdC5ib3R0b20gLSAxNTtcclxuICAgICAgICAgIGVsZW1SZWN0ID0gdG9vbGJhclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdkcmFnZ2FibGUyJyxuZXdNYXBSZWN0KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIG9mZnNldFRvcCA9IDA7XHJcbiAgICAgICAgICBvZmZzZXRMZWZ0ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhcnRYID0gZXZlbnQucGFnZVggLSB4IC0gb2Zmc2V0TGVmdDtcclxuICAgICAgICBzdGFydFkgPSBldmVudC5wYWdlWSAtIHkgLSBvZmZzZXRUb3A7XHJcbiAgICAgICAgZWxlbWVudC5jc3Moe1xyXG4gICAgICAgICAgY3Vyc29yOiAnLXdlYmtpdC1ncmFiYmluZydcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNlbW92ZScsIG1vdXNlbW92ZSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZXVwJywgbW91c2V1cCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgZnVuY3Rpb24gbW91c2Vtb3ZlKGV2ZW50KSB7XHJcbiAgICAgICAgeSA9IGV2ZW50LnBhZ2VZIC0gc3RhcnRZO1xyXG4gICAgICAgIHggPSBldmVudC5wYWdlWCAtIHN0YXJ0WDtcclxuXHJcbiAgICAgICAgaWYoIWluc2lkZU1hcCgpKSB7XHJcbiAgICAgICAgICB0b29sYmFyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogeTEgKyAncHgnLFxyXG4gICAgICAgICAgICBsZWZ0OiB4MSArICdweCdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgeDEgPSB4O1xyXG4gICAgICAgICAgeTEgPSB5O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gbW91c2V1cCgpIHtcclxuICAgICAgICBlbGVtZW50LmNzcyh7XHJcbiAgICAgICAgICBjdXJzb3I6ICctd2Via2l0LWdyYWInXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9mZignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcclxuICAgICAgICAkZG9jdW1lbnQub2ZmKCdtb3VzZXVwJywgbW91c2V1cCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGluc2lkZU1hcCgpe1xyXG4gICAgICAgIHRvb2xiYXIuY3NzKHtcclxuICAgICAgICAgIHRvcDogeSArICdweCcsXHJcbiAgICAgICAgICBsZWZ0OiB4ICsgJ3B4J1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGVsZW1SZWN0ID0gdG9vbGJhclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICBpZihlbGVtUmVjdC50b3AgPCBuZXdNYXBSZWN0LnRvcCB8fCBlbGVtUmVjdC5sZWZ0IDwgbmV3TWFwUmVjdC5sZWZ0IHx8IGVsZW1SZWN0LnJpZ2h0ID4gbmV3TWFwUmVjdC5yaWdodCB8fCBlbGVtUmVjdC5ib3R0b20gPiBuZXdNYXBSZWN0LmJvdHRvbSl7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1dKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZXJlenkgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgndG9vbGJhcicsIGZ1bmN0aW9uKCkge1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICB0ZW1wbGF0ZSA6ICc8ZGl2IGNsYXNzPVwidG9vbGJhclwiID48ZGl2IGNsYXNzPVwiZHJhZy1idXR0b24gZ2x5cGhpY29uIGdseXBoaWNvbi1taW51c1wiIGRyYWdnYWJsZT48L2Rpdj4gPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPjwvZGl2PicsXHJcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIGxldCBjdXJyZW50VG9vbCA9IG51bGw7XHJcblxyXG4gICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9ICgpID0+ICRzY29wZS5nZXRDZXNpdW1XaWRnZXQoKTtcclxuXHJcbiAgICAgIHRoaXMuc3RhcnRUb29sID0gZnVuY3Rpb24odG9vbCl7XHJcbiAgICAgICAgaWYoY3VycmVudFRvb2wgIT09IG51bGwpe1xyXG4gICAgICAgICAgY3VycmVudFRvb2wuc3RvcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmVudFRvb2wgPSB0b29sO1xyXG4gICAgICAgIGN1cnJlbnRUb29sLnN0YXJ0KCk7XHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpe1xyXG4gICAgICAgIHNjb3BlLmdldENlc2l1bVdpZGdldCA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDIvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnWm9vbVRvb2wnLCBbJ1Rvb2wnLFxyXG4gICAgZnVuY3Rpb24oVG9vbCl7XHJcblxyXG4gICAgICBjbGFzcyBab29tVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKG1hcCl7XHJcbiAgICAgICAgICB0aGlzLl9jYW1lcmEgPSBtYXAuc2NlbmUuY2FtZXJhO1xyXG4gICAgICAgICAgdGhpcy5fZWxsaXBzb2lkID0gbWFwLnNjZW5lLmdsb2JlLmVsbGlwc29pZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXJ0KCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcblxyXG4gICAgICAgIHN0b3AoKXsgY29uc29sZS5sb2coJ0V4YW1wLVRvb2wgc3RhcnQhJyk7IH1cclxuXHJcbiAgICAgICAgY2FuY2VsKCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcblxyXG4gICAgICAgIG9uVXBkYXRlKCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcblxyXG4gICAgICAgIHpvb21JbihqdW1wcyl7XHJcbiAgICAgICAgICBqdW1wcyA9IE51bWJlci5pc0Zpbml0ZShqdW1wcykgPyBqdW1wcyA6IDE7XHJcbiAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwganVtcHM7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjYW1lcmFIZWlnaHQgPSB0aGlzLl9lbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpcy5fY2FtZXJhLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEubW92ZUZvcndhcmQobW92ZVJhdGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgem9vbU91dChqdW1wcyl7XHJcbiAgICAgICAgICBqdW1wcyA9IE51bWJlci5pc0Zpbml0ZShqdW1wcykgPyBqdW1wcyA6IDE7XHJcbiAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwganVtcHM7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjYW1lcmFIZWlnaHQgPSB0aGlzLl9lbGxpcHNvaWQuY2FydGVzaWFuVG9DYXJ0b2dyYXBoaWModGhpcy5fY2FtZXJhLnBvc2l0aW9uKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtb3ZlUmF0ZSA9IGNhbWVyYUhlaWdodCAvIDEwMC4wO1xyXG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEubW92ZUJhY2t3YXJkKG1vdmVSYXRlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBab29tVG9vbDtcclxuICAgIH1cclxuICBdKTtcclxuXHJcbn0od2luZG93LmFuZ3VsYXIpKTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMi8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3pvb21XaWRnZXQnLCBbJyRkb2N1bWVudCcsXHJcbiAgICBmdW5jdGlvbigkZG9jdW1lbnQpe1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZTogJ150b29sJyxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJ6b29tLXdpZGdldFwiPicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiem9vbS1pbi1idG5cIj4nICtcclxuICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBuZy1jbGljaz1cInpvb21JbigpO1wiPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1pblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcclxuICAgICAgICAnPC9idXR0b24+JyArXHJcbiAgICAgICAgJzwvZGl2PicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic2xpZGVyXCI+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiYmFyXCI+JyArXHJcbiAgICAgICAgJzwvc3Bhbj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJwb2ludGVyXCI+JyArXHJcbiAgICAgICAgJzwvc3Bhbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJ6b29tLW91dC1idG5cIj4nICtcclxuICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBuZy1jbGljaz1cInpvb21PdXQoKTtcIj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXpvb20tb3V0XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xyXG4gICAgICAgICc8L2J1dHRvbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzwvZGl2PicsXHJcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB0b29sQ3RybCl7XHJcbiAgICAgICAgICBpZihpc0Zpbml0ZShhdHRycy53aWR0aCkgfHwgaXNGaW5pdGUoYXR0cnMuaGVpZ2h0KSl7XHJcbiAgICAgICAgICAgIGxldCB3aWR0aCA9ICBpc0Zpbml0ZShhdHRycy53aWR0aCkgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMud2lkdGgpICsgJ3B4JyA6ICdpbmhlcml0JztcclxuICAgICAgICAgICAgbGV0IGhlaWdodCA9ICBpc0Zpbml0ZShhdHRycy5oZWlnaHQpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLmhlaWdodCkgKyAncHgnIDogJ2luaGVyaXQnO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNzcyh7cG9zaXRpb246ICdyZWxhdGl2ZScsIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgbWluTGV2ZWwgPSBpc0Zpbml0ZShhdHRycy5taW4pID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1pbikgOiAwO1xyXG4gICAgICAgICAgbGV0IG1heExldmVsID0gaXNGaW5pdGUoYXR0cnMubWF4KSA/IE51bWJlci5wYXJzZUludChhdHRycy5tYXgpIDogMTAwO1xyXG5cclxuICAgICAgICAgIGlmKG1pbkxldmVsIDwgMCB8fCBtYXhMZXZlbCA8IDAgfHwgbWluTGV2ZWwgPj0gbWF4TGV2ZWwpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtaW4gb3IgbWF4IGF0dHJpYnV0ZXMgdmFsdWUgYXJlIGludmFsaWQuXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBqdW1wcyA9IGlzRmluaXRlKGF0dHJzLmp1bXApID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLmp1bXApIDogMTA7XHJcblxyXG4gICAgICAgICAgbGV0IHpvb21Ub29sID0gdG9vbEN0cmwuZ2V0VG9vbCgpO1xyXG5cclxuICAgICAgICAgIGxldCBsZXZlbFZhbHVlID0gOTAgLyAobWF4TGV2ZWwgLSBtaW5MZXZlbCk7XHJcbiAgICAgICAgICBsZXQgY3VycmVudExldmVsID0gKG1heExldmVsIC0gbWluTGV2ZWwpIC8gMjtcclxuICAgICAgICAgIGxldCB6b29tTGV2ZWwgPSAobWF4TGV2ZWwgKyBtaW5MZXZlbCkgLyAyO1xyXG4gICAgICAgICAgbGV0IHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcclxuICAgICAgICAgIGxldCBjdXJyZW50UG9pbnRlckhlaWdodCA9IDQ1O1xyXG5cclxuICAgICAgICAgIGxldCBwb2ludGVyICA9IGFuZ3VsYXIuZWxlbWVudChlbGVtZW50LmZpbmQoJ3NwYW4nKVsyXSk7XHJcbiAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudExldmVsICogbGV2ZWxWYWx1ZSArICclJyk7XHJcblxyXG4gICAgICAgICAgbGV0IGNsaWVudFkgPSBudWxsO1xyXG4gICAgICAgICAgbGV0IGJhckhlaWdodCA9IHBvaW50ZXJbMF0uY2xpZW50SGVpZ2h0ICogMTA7XHJcbiAgICAgICAgICBsZXQgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgcG9pbnRlci5vbignbW91c2Vkb3duJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICAgICAgc3RhcnRQb2ludGVySGVpZ2h0ID0gY3VycmVudFBvaW50ZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIHRlbXBMZXZlbCA9IHpvb21MZXZlbDtcclxuICAgICAgICAgICAgcG9pbnRlci5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNsaWVudFkgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgIGNsaWVudFkgPSBudWxsO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHpvb21MZXZlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZihjbGllbnRZICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICBsZXQgZGVsdGFZID0gY2xpZW50WSAtIGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgICAgICAgbGV0IHBlcmNlbnQgPSAoTWF0aC5hYnMoZGVsdGFZKSAqIDEwMCAvIGJhckhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgIGlmKGRlbHRhWSA+IDApe1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudCA+PSAwKXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBzdGFydFBvaW50ZXJIZWlnaHQgLSBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGlmKHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQgPD0gOTApe1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSA5MDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbCA9IE1hdGgudHJ1bmMoY3VycmVudFBvaW50ZXJIZWlnaHQgLyBsZXZlbFZhbHVlKTtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwgPSBtYXhMZXZlbCAtIGN1cnJlbnRMZXZlbDtcclxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPiB0ZW1wTGV2ZWwpe1xyXG4gICAgICAgICAgICAgICAgem9vbVRvb2wuem9vbUluKCh6b29tTGV2ZWwgLSB0ZW1wTGV2ZWwpICoganVtcHMpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZih6b29tTGV2ZWwgPCB0ZW1wTGV2ZWwpe1xyXG4gICAgICAgICAgICAgICAgem9vbVRvb2wuem9vbU91dCgodGVtcExldmVsIC0gem9vbUxldmVsKSAqIGp1bXBzKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGVtcExldmVsID0gem9vbUxldmVsO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlICsgJyUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgc2NvcGUuem9vbUluID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoem9vbUxldmVsIDwgbWF4TGV2ZWwpe1xyXG4gICAgICAgICAgICAgIHpvb21MZXZlbCsrO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbC0tO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gY3VycmVudExldmVsICogbGV2ZWxWYWx1ZTtcclxuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudFBvaW50ZXJIZWlnaHQgKyAnJScpO1xyXG4gICAgICAgICAgICAgIHpvb21Ub29sLnpvb21JbihqdW1wcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuem9vbU91dCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHpvb21MZXZlbCA+IG1pbkxldmVsKXtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwtLTtcclxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwrKztcclxuICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWU7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRQb2ludGVySGVpZ2h0ICsgJyUnKTtcclxuICAgICAgICAgICAgICB6b29tVG9vbC56b29tT3V0KGp1bXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==