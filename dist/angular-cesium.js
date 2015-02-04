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
        scope.mapRect = element[0].getBoundingClientRect();
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
    var ZoomTool = function ZoomTool() {
      $traceurRuntime.superConstructor($ZoomTool).apply(this, arguments);
    };
    var $ZoomTool = ZoomTool;
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
        var minLevel = isFinite(attrs.min) ? Number.parseInt(attrs.min) : 0;
        var maxLevel = isFinite(attrs.max) ? Number.parseInt(attrs.max) : 100;
        if (minLevel < 0 || maxLevel < 0 || minLevel >= maxLevel) {
          throw new Error("min or max attrs value are invalid.");
        }
        var levelValue = 90 / (maxLevel - minLevel);
        var currentLevel = (maxLevel - minLevel) / 2;
        var zoomLevel = (maxLevel + minLevel) / 2;
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
            pointer.css('top', currentLevel * levelValue + '%');
          }
        }));
        scope.zoomIn = function() {
          if (zoomLevel < maxLevel) {
            zoomLevel++;
            currentLevel--;
            currentPointerHeight = currentLevel * levelValue;
            pointer.css('top', currentPointerHeight + '%');
            console.log(zoomLevel);
          }
        };
        scope.zoomOut = function() {
          if (zoomLevel > minLevel) {
            zoomLevel--;
            currentLevel++;
            currentPointerHeight = currentLevel * levelValue;
            pointer.css('top', currentPointerHeight + '%');
            console.log(zoomLevel);
          }
        };
      }
    };
  }]);
}(window.angular));
//# sourceURL=map-components/tools/zoom/zoom-widget.drv.js
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Rvb2wuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmQvYmlsbGJvYXJkLmpzIiwibWFwLWNvbXBvbmVudHMvYmlsbGJvYXJkcy1sYXllci9iaWxsYm9hcmRzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvY29tcGxleC1sYXllci9jb21wbGV4LWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbGFiZWwvbGFiZWwuanMiLCJtYXAtY29tcG9uZW50cy9tYXAvbWFwLWRpcmVjdGl2ZS5qcyIsIm1hcC1jb21wb25lbnRzL2xhYmVscy1sYXllci9sYWJlbHMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9wb2x5bGluZXMtbGF5ZXIvcG9seWxpbmVzLWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbC90b29sLWJhci5kcnYuanMiLCJtYXAtY29tcG9uZW50cy90b29sL3Rvb2wuZHJ2LmpzIiwibWFwLWNvbXBvbmVudHMvdG9vbGJhci9kcmFnZ2FibGUuanMiLCJtYXAtY29tcG9uZW50cy90b29sYmFyL3Rvb2xiYXIuanMiLCJtYXAtY29tcG9uZW50cy9wb2x5bGluZS9wb2x5bGluZS5qcyIsIm1hcC1jb21wb25lbnRzL3dlYi1tYXAtc2VydmljZS1sYXllci93ZWItbWFwLXNlcnZpY2UtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29scy96b29tL3pvb20tdG9vbC5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2xzL3pvb20vem9vbS13aWRnZXQuZHJ2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFuZ3VsYXItY2VzaXVtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJywgWydvYnNlcnZhYmxlQ29sbGVjdGlvbiddKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5zZXJ2aWNlKCdCaWxsQm9hcmRBdHRyaWJ1dGVzJywgZnVuY3Rpb24oJHBhcnNlKSB7XHJcbiAgdGhpcy5jYWxjQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGF0dHJzLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBpbWFnZSA6ICRwYXJzZShhdHRycy5pbWFnZSkoY29udGV4dClcclxuICAgIH07XHJcbiAgICB2YXIgcG9zaXRpb25BdHRyID0gJHBhcnNlKGF0dHJzLnBvc2l0aW9uKShjb250ZXh0KTtcclxuICAgIHJlc3VsdC5wb3NpdGlvbiA9IENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbkF0dHIubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb25BdHRyLmFsdGl0dWRlKSB8fCAwKTtcclxuXHJcbiAgICB2YXIgY29sb3IgPSAkcGFyc2UoYXR0cnMuY29sb3IpKGNvbnRleHQpO1xyXG4gICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgIHJlc3VsdC5jb2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoY29sb3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAxMC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnQ2VzaXVtJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIENlc2l1bTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnVG9vbCcsIFtcclxuICAgIGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICBjbGFzcyBUb29sIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihtYXApeyB0aGlzLl9tYXAgPSBtYXA7IH1cclxuICAgICAgICBzdGFydCgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7IH1cclxuICAgICAgICBzdG9wKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxyXG4gICAgICAgIGNhbmNlbCgpeyB0aHJvdyBcIk5vIGltcGxlbWVudGF0aW9uXCI7fVxyXG4gICAgICAgIG9uVXBkYXRlKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjt9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBUb29sO1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2JpbGxib2FyZCcsIGZ1bmN0aW9uKEJpbGxCb2FyZEF0dHJpYnV0ZXMpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15iaWxsYm9hcmRzTGF5ZXInLFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgYmlsbGJvYXJkc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgYmlsbERlc2MgPSBCaWxsQm9hcmRBdHRyaWJ1dGVzLmNhbGNBdHRyaWJ1dGVzKGF0dHJzLCBzY29wZSk7XHJcblxyXG4gICAgICB2YXIgYmlsbGJvYXJkID0gYmlsbGJvYXJkc0xheWVyQ3RybC5nZXRCaWxsYm9hcmRDb2xsZWN0aW9uKCkuYWRkKGJpbGxEZXNjKTtcclxuXHJcbiAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBiaWxsYm9hcmRzTGF5ZXJDdHJsLmdldEJpbGxib2FyZENvbGxlY3Rpb24oKS5yZW1vdmUoYmlsbGJvYXJkKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdiaWxsYm9hcmRzTGF5ZXInLCBmdW5jdGlvbigkcGFyc2UsIE9ic2VydmFibGVDb2xsZWN0aW9uLCBCaWxsQm9hcmRBdHRyaWJ1dGVzLCBDZXNpdW0pIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSwgJGF0dHJzKSB7XHJcbiAgICAgIHRoaXMuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICgkYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGdldCBjb2xsZWN0aW9uIGlmIGxheWVyIGlzIGJvdW5kIHRvIE9ic2VydmFibGVDb2xsZWN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5CaWxsYm9hcmRDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgaWYgKGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICB2YXIgQ09MTEVDVElPTl9SRUdFWFAgPSAvXFxzKihbXFwkXFx3XVtcXCRcXHddKilcXHMraW5cXHMrKFtcXCRcXHddW1xcJFxcd10qKS87XHJcbiAgICAgICAgICB2YXIgbWF0Y2ggPSBhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbi5tYXRjaChDT0xMRUNUSU9OX1JFR0VYUCk7XHJcbiAgICAgICAgICB2YXIgaXRlbU5hbWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgIHZhciBjb2xsZWN0aW9uID0gJHBhcnNlKG1hdGNoWzJdKShzY29wZSk7XHJcbiAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24gaW5zdGFuY2VvZiBPYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ29ic2VydmFibGUtY29sbGVjdGlvbiBtdXN0IGJlIG9mIHR5cGUgT2JzZXJ2YWJsZUNvbGxlY3Rpb24uJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGFkZEJpbGxib2FyZCA9IGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHt9O1xyXG4gICAgICAgICAgICAgIGNvbnRleHRbaXRlbU5hbWVdID0gaXRlbTtcclxuICAgICAgICAgICAgICB2YXIgYmlsbERlc2MgPSBCaWxsQm9hcmRBdHRyaWJ1dGVzLmNhbGNBdHRyaWJ1dGVzKGF0dHJzLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgICAgc2NvcGUuY29sbGVjdGlvbi5hZGQoYmlsbERlc2MpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvbGxlY3Rpb24uZ2V0RGF0YSgpLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgYWRkQmlsbGJvYXJkKGl0ZW0pXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uQWRkKGFkZEJpbGxib2FyZCk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25VcGRhdGUoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uUmVtb3ZlKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgc2NvcGUuY29sbGVjdGlvbi5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbi5nZXQoaW5kZXgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTcvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnY29tcGxleExheWVyJywgZnVuY3Rpb24oJGxvZykge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBjb21waWxlIDogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgaWYgKGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnQuY2hpbGRyZW4oKSwgZnVuY3Rpb24gKGNoaWxkKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGxheWVyID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgIGlmIChjaGlsZC50YWdOYW1lID09PSAnQklMTEJPQVJEJykge1xyXG4gICAgICAgICAgICBsYXllciA9IGFuZ3VsYXIuZWxlbWVudCgnPGJpbGxib2FyZHMtbGF5ZXI+PC9iaWxsYm9hcmRzLWxheWVyPicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoY2hpbGQudGFnTmFtZSA9PT0gJ0xBQkVMJykge1xyXG4gICAgICAgICAgICBsYXllciA9IGFuZ3VsYXIuZWxlbWVudCgnPGxhYmVscy1sYXllcj48L2xhYmVscy1sYXllcj4nKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIWxheWVyKSB7XHJcbiAgICAgICAgICAgICRsb2cud2FybignRm91bmQgYW4gdW5rbm93biBjaGlsZCBvZiBvZiBjb21wbGV4LWxheWVyLiBSZW1vdmluZy4uLicpO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjaGlsZC5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG4gICAgICAgICAgICAgIGxheWVyLmF0dHIoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50WzBdLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdHRyKSB7XHJcbiAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLmF0dHIoYXR0ci5uYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuYXR0cihhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChjaGlsZCkucmVwbGFjZVdpdGgobGF5ZXIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2xhYmVsJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebGFiZWxzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB0ZXh0IDogJyYnLFxyXG4gICAgICBwb3NpdGlvbiA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGxhYmVsc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgbGFiZWxEZXNjID0ge307XHJcblxyXG4gICAgICB2YXIgcG9zaXRpb24gPSBzY29wZS5wb3NpdGlvbigpO1xyXG4gICAgICBsYWJlbERlc2MucG9zaXRpb24gPSBDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCk7XHJcblxyXG4gICAgICB2YXIgY29sb3IgPSBzY29wZS5jb2xvcigpO1xyXG4gICAgICBpZiAoY29sb3IpIHtcclxuICAgICAgICBsYWJlbERlc2MuY29sb3IgPSBjb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGFiZWxEZXNjLnRleHQgPSBzY29wZS50ZXh0KCk7XHJcblxyXG4gICAgICB2YXIgbGFiZWwgPSBsYWJlbHNMYXllckN0cmwuZ2V0TGFiZWxDb2xsZWN0aW9uKCkuYWRkKGxhYmVsRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLnJlbW92ZShsYWJlbCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbWFwJywgZnVuY3Rpb24oKSB7XHJcbiAgZnVuY3Rpb24gZ2V0U2NlbmVNb2RlKGRpbWVuc2lvbnMpIHtcclxuICAgIGlmIChkaW1lbnNpb25zID09IDIpIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUyRDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGRpbWVuc2lvbnMgPT0gMi41KSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLkNPTFVNQlVTX1ZJRVc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIENlc2l1bS5TY2VuZU1vZGUuU0NFTkUzRDtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICB0ZW1wbGF0ZSA6ICc8ZGl2PiA8bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+IDxkaXYgY2xhc3M9XCJtYXAtY29udGFpbmVyXCI+PC9kaXY+IDwvZGl2PicsXHJcbiAgICB0cmFuc2NsdWRlIDogdHJ1ZSxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBkaW1lbnNpb25zIDogJ0AnXHJcbiAgICB9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldENlc2l1bVdpZGdldCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY2VzaXVtO1xyXG4gICAgICB9O1xyXG4gICAgICAkc2NvcGUub25Ecm9wID0gZnVuY3Rpb24oZXZlbnQpe1xyXG5cclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xyXG4gICAgICAgIGlmICghc2NvcGUuZGltZW5zaW9ucykge1xyXG4gICAgICAgICAgc2NvcGUuZGltZW5zaW9ucyA9IDM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY29wZS5jZXNpdW0gPSBuZXcgQ2VzaXVtLkNlc2l1bVdpZGdldChlbGVtZW50LmZpbmQoJ2RpdicpWzBdLCB7XHJcbiAgICAgICAgICBzY2VuZU1vZGU6IGdldFNjZW5lTW9kZShzY29wZS5kaW1lbnNpb25zKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNjb3BlLm1hcFJlY3QgPSBlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnbGFiZWxzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRMYWJlbENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5MYWJlbENvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdpbG5pczIgb24gMTgvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgncG9seWxpbmVzTGF5ZXInLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgc2NvcGUgOiB7fSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRQb2x5bGluZUNvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5Qb2x5bGluZUNvbGxlY3Rpb24oKTtcclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKGFuZ3VsYXIpe1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sQmFyJywgW1xyXG4gICAgZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXF1aXJlOiAnXm1hcCcsXHJcbiAgICAgICAgLy90cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgIC8vdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU9XCJcIj48L2Rpdj4nLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJyxcclxuICAgICAgICAgIGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbGluazoge1xyXG4gICAgICAgICAgcHJlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpe1xyXG4gICAgICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAxLzAyLzE1LlxuICovXG5cbihmdW5jdGlvbihhbmd1bGFyKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2wnLCBbJ1Rvb2wnLFxuICAgIGZ1bmN0aW9uKFRvb2wpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZTogJ150b29sYmFyJyxcbiAgICAgICAgdHJhbnNjbHVkZTogJ2VsZW1lbnQnLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgIHR5cGU6ICc9J1xuICAgICAgICB9LFxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsXG4gICAgICAgICAgZnVuY3Rpb24oJHNjb3BlKXtcbiAgICAgICAgICAgIHRoaXMuZ2V0VG9vbCA9ICgpID0+ICRzY29wZS50b29sO1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgY29tcGlsZTogZnVuY3Rpb24oZWxlbWVudCwgYXR0cnMpe1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xCYXJDdHJsLCBsaW5rZXIpe1xuICAgICAgICAgICAgaWYoISh0eXBlb2Ygc2NvcGUudHlwZSA9PT0gJ2Z1bmN0aW9uJykpe1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidHlwZSBhdHRyIG11c3QgYmUgY29uc3RydWN0b3IuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdG9vbCA9IG5ldyBzY29wZS50eXBlKHRvb2xCYXJDdHJsLmdldENlc2l1bVdpZGdldCgpKTtcblxuICAgICAgICAgICAgaWYoISh0b29sIGluc3RhbmNlb2YgVG9vbCkpe1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidG9vbCBtdXN0IGJlIGluc3RhbmNlIG9mIFRvb2wuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgcHJveHkgPSB7fTtcblxuICAgICAgICAgICAgZm9yKGxldCBrZXkgaW4gdG9vbCl7XG4gICAgICAgICAgICAgIGlmKGtleSA9PT0gJ3N0YXJ0Jyl7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5LCBrZXksIHtcbiAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IHRvb2xba2V5XSxcbiAgICAgICAgICAgICAgICBzZXQ6IHZhbCA9PiB7IHRvb2xba2V5XSA9IHZhbDsgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5LCAnc3RhcnQnLCB7XG4gICAgICAgICAgICAgIGdldDogKCkgPT4gKCkgPT4gdG9vbEJhckN0cmwuc3RhcnRUb29sKHRvb2wpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2NvcGUudG9vbCA9IHByb3h5O1xuXG4gICAgICAgICAgICBsaW5rZXIoc2NvcGUsIChjbG9uZSkgPT4ge1xuICAgICAgICAgICAgICBlbGVtZW50LnBhcmVudCgpLmFwcGVuZChjbG9uZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxufSh3aW5kb3cuYW5ndWxhcikpO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZXJlenkgb24gMi8xLzIwMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpXHJcbiAgLmRpcmVjdGl2ZSgnZHJhZ2dhYmxlJywgWyckZG9jdW1lbnQnLCBmdW5jdGlvbigkZG9jdW1lbnQpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cikge1xyXG4gICAgICB2YXIgc3RhcnRYID0gMCwgc3RhcnRZID0gMCwgeCA9IDAsIHkgPSAwLCAgeDEgPSAwLCB5MSA9IDAsIG9mZnNldFRvcCA9IC0xLG9mZnNldExlZnQgPSAtMTtcclxuICAgICAgdmFyIG1hcFJlY3QgPSBzY29wZS4kcGFyZW50Lm1hcFJlY3QsbmV3TWFwUmVjdCA9IHt9LCBlbGVtUmVjdCA9IHt9O1xyXG4gICAgICB2YXIgdG9vbGJhciA9IGVsZW1lbnQucGFyZW50KCk7XHJcbiAgICAgIGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgLy8gUHJldmVudCBkZWZhdWx0IGRyYWdnaW5nIG9mIHNlbGVjdGVkIGNvbnRlbnRcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmKG9mZnNldFRvcCA9PSAtMSl7XHJcbiAgICAgICAgICBvZmZzZXRUb3AgPSB0b29sYmFyWzBdLm9mZnNldFRvcDtcclxuICAgICAgICAgIG9mZnNldExlZnQgPSB0b29sYmFyWzBdLm9mZnNldExlZnQ7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LnRvcCA9IG9mZnNldFRvcCArIG1hcFJlY3QudG9wO1xyXG4gICAgICAgICAgbmV3TWFwUmVjdC5sZWZ0ID0gb2Zmc2V0TGVmdCArIG1hcFJlY3QubGVmdDtcclxuICAgICAgICAgIG5ld01hcFJlY3QucmlnaHQgPSBvZmZzZXRMZWZ0ICsgbWFwUmVjdC5yaWdodCAtIDU7XHJcbiAgICAgICAgICBuZXdNYXBSZWN0LmJvdHRvbSA9IG9mZnNldFRvcCArIG1hcFJlY3QuYm90dG9tIC0gMTU7XHJcbiAgICAgICAgICBlbGVtUmVjdCA9IHRvb2xiYXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnZHJhZ2dhYmxlMicsbmV3TWFwUmVjdCk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBvZmZzZXRUb3AgPSAwO1xyXG4gICAgICAgICAgb2Zmc2V0TGVmdCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXJ0WCA9IGV2ZW50LnBhZ2VYIC0geCAtIG9mZnNldExlZnQ7XHJcbiAgICAgICAgc3RhcnRZID0gZXZlbnQucGFnZVkgLSB5IC0gb2Zmc2V0VG9wO1xyXG4gICAgICAgIGVsZW1lbnQuY3NzKHtcclxuICAgICAgICAgIGN1cnNvcjogJy13ZWJraXQtZ3JhYmJpbmcnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xyXG4gICAgICAgICRkb2N1bWVudC5vbignbW91c2V1cCcsIG1vdXNldXApO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIG1vdXNlbW92ZShldmVudCkge1xyXG4gICAgICAgIHkgPSBldmVudC5wYWdlWSAtIHN0YXJ0WTtcclxuICAgICAgICB4ID0gZXZlbnQucGFnZVggLSBzdGFydFg7XHJcblxyXG4gICAgICAgIGlmKCFpbnNpZGVNYXAoKSkge1xyXG4gICAgICAgICAgdG9vbGJhci5jc3Moe1xyXG4gICAgICAgICAgICB0b3A6IHkxICsgJ3B4JyxcclxuICAgICAgICAgICAgbGVmdDogeDEgKyAncHgnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIHgxID0geDtcclxuICAgICAgICAgIHkxID0geTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIG1vdXNldXAoKSB7XHJcbiAgICAgICAgZWxlbWVudC5jc3Moe1xyXG4gICAgICAgICAgY3Vyc29yOiAnLXdlYmtpdC1ncmFiJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkb2N1bWVudC5vZmYoJ21vdXNlbW92ZScsIG1vdXNlbW92ZSk7XHJcbiAgICAgICAgJGRvY3VtZW50Lm9mZignbW91c2V1cCcsIG1vdXNldXApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBpbnNpZGVNYXAoKXtcclxuICAgICAgICB0b29sYmFyLmNzcyh7XHJcbiAgICAgICAgICB0b3A6IHkgKyAncHgnLFxyXG4gICAgICAgICAgbGVmdDogeCArICdweCdcclxuICAgICAgICB9KTtcclxuICAgICAgICBlbGVtUmVjdCA9IHRvb2xiYXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgaWYoZWxlbVJlY3QudG9wIDwgbmV3TWFwUmVjdC50b3AgfHwgZWxlbVJlY3QubGVmdCA8IG5ld01hcFJlY3QubGVmdCB8fCBlbGVtUmVjdC5yaWdodCA+IG5ld01hcFJlY3QucmlnaHQgfHwgZWxlbVJlY3QuYm90dG9tID4gbmV3TWFwUmVjdC5ib3R0b20pe1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGVyZXp5IG9uIDAxLzAyLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3Rvb2xiYXInLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdiBjbGFzcz1cInRvb2xiYXJcIiA+PGRpdiBjbGFzcz1cImRyYWctYnV0dG9uIGdseXBoaWNvbiBnbHlwaGljb24tbWludXNcIiBkcmFnZ2FibGU+PC9kaXY+IDxuZy10cmFuc2NsdWRlPjwvbmctdHJhbnNjbHVkZT48L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICBsZXQgY3VycmVudFRvb2wgPSBudWxsO1xyXG5cclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XHJcblxyXG4gICAgICB0aGlzLnN0YXJ0VG9vbCA9IGZ1bmN0aW9uKHRvb2wpe1xyXG4gICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcclxuICAgICAgICAgIGN1cnJlbnRUb29sLnN0b3AoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cnJlbnRUb29sID0gdG9vbDtcclxuICAgICAgICBjdXJyZW50VG9vbC5zdGFydCgpO1xyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKXtcclxuICAgICAgICBzY29wZS5nZXRDZXNpdW1XaWRnZXQgPSBtYXBDdHJsLmdldENlc2l1bVdpZGdldDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBnaWxuaXMyIG9uIDE4LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3BvbHlsaW5lJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdecG9seWxpbmVzTGF5ZXInLFxyXG4gICAgc2NvcGUgOiB7XHJcbiAgICAgIGNvbG9yIDogJyYnLFxyXG4gICAgICB3aWR0aCA6ICcmJyxcclxuICAgICAgcG9zaXRpb25zIDogJyYnXHJcbiAgICB9LFxyXG4gICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgcG9seWxpbmVzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBwb2x5bGluZURlc2MgPSB7fTtcclxuXHJcbiAgICAgIGlmICghYW5ndWxhci5pc0RlZmluZWQoc2NvcGUucG9zaXRpb25zKSB8fCAhYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLnBvc2l0aW9ucykpe1xyXG4gICAgICAgIHRocm93IFwiUG9seWxpbmUgcG9zaXRpb25zIG11c3QgYmUgZGVmaW5lZCBhcyBhIGZ1bmN0aW9uXCI7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHBvc2l0aW9ucyA9IHNjb3BlLnBvc2l0aW9ucygpO1xyXG4gICAgICBwb2x5bGluZURlc2MucG9zaXRpb25zID0gW107XHJcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChwb3NpdGlvbnMsIGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcG9seWxpbmVEZXNjLnBvc2l0aW9ucy5wdXNoKENlc2l1bS5DYXJ0ZXNpYW4zLmZyb21EZWdyZWVzKE51bWJlcihwb3NpdGlvbi5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmxvbmdpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uLmFsdGl0dWRlKSB8fCAwKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNlc2l1bUNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZygnYmxhY2snKTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLmNvbG9yKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUuY29sb3IpKXtcclxuICAgICAgICBjZXNpdW1Db2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoc2NvcGUuY29sb3IoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICBwb2x5bGluZURlc2MubWF0ZXJpYWwgPSBDZXNpdW0uTWF0ZXJpYWwuZnJvbVR5cGUoJ0NvbG9yJyk7XHJcbiAgICAgIHBvbHlsaW5lRGVzYy5tYXRlcmlhbC51bmlmb3Jtcy5jb2xvciA9IGNlc2l1bUNvbG9yO1xyXG5cclxuICAgICAgcG9seWxpbmVEZXNjLndpZHRoID0gMTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLndpZHRoKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oc2NvcGUud2lkdGgpKXtcclxuICAgICAgICBwb2x5bGluZURlc2Mud2lkdGggPSBzY29wZS53aWR0aCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcG9seWxpbmUgPSBwb2x5bGluZXNMYXllckN0cmwuZ2V0UG9seWxpbmVDb2xsZWN0aW9uKCkuYWRkKHBvbHlsaW5lRGVzYyk7XHJcblxyXG4gICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcG9seWxpbmVzTGF5ZXJDdHJsLmdldFBvbHlsaW5lQ29sbGVjdGlvbigpLnJlbW92ZShwb2x5bGluZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnd2ViTWFwU2VydmljZUxheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICB1cmwgOiAnJicsXHJcbiAgICAgIGxheWVycyA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgIHZhciBwcm92aWRlciA9IG5ldyBDZXNpdW0uV2ViTWFwU2VydmljZUltYWdlcnlQcm92aWRlcih7XHJcbiAgICAgICAgdXJsOiBzY29wZS51cmwoKSxcclxuICAgICAgICBsYXllcnMgOiBzY29wZS5sYXllcnMoKVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBsYXllciA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5hZGRJbWFnZXJ5UHJvdmlkZXIocHJvdmlkZXIpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5yZW1vdmUobGF5ZXIpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMi8wMi8xNS5cclxuICovXHJcblxyXG4oZnVuY3Rpb24oYW5ndWxhcil7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdab29tVG9vbCcsIFsnVG9vbCcsXHJcbiAgICBmdW5jdGlvbihUb29sKXtcclxuXHJcbiAgICAgIGNsYXNzIFpvb21Ub29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICAgICAgc3RhcnQoKXsgY29uc29sZS5sb2coJ0V4YW1wLVRvb2wgc3RhcnQhJyk7IH1cclxuICAgICAgICBzdG9wKCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcbiAgICAgICAgY2FuY2VsKCl7IGNvbnNvbGUubG9nKCdFeGFtcC1Ub29sIHN0YXJ0IScpOyB9XHJcbiAgICAgICAgb25VcGRhdGUoKXsgY29uc29sZS5sb2coJ0V4YW1wLVRvb2wgc3RhcnQhJyk7IH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFpvb21Ub29sO1xyXG4gICAgfVxyXG4gIF0pO1xyXG5cclxufSh3aW5kb3cuYW5ndWxhcikpO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSB0emFjaGl0IG9uIDAyLzAyLzE1LlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbihhbmd1bGFyKXtcclxuXHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBhbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnem9vbVdpZGdldCcsIFsnJGRvY3VtZW50JyxcclxuICAgIGZ1bmN0aW9uKCRkb2N1bWVudCl7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlOiAnXnRvb2wnLFxyXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInpvb20td2lkZ2V0XCI+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJ6b29tLWluLWJ0blwiPicgK1xyXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIG5nLWNsaWNrPVwiem9vbUluKCk7XCI+JyArXHJcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi16b29tLWluXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xyXG4gICAgICAgICc8L2J1dHRvbj4nICtcclxuICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJzbGlkZXJcIj4nICtcclxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJiYXJcIj4nICtcclxuICAgICAgICAnPC9zcGFuPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cInBvaW50ZXJcIj4nICtcclxuICAgICAgICAnPC9zcGFuPicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInpvb20tb3V0LWJ0blwiPicgK1xyXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIG5nLWNsaWNrPVwiem9vbU91dCgpO1wiPicgK1xyXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tem9vbS1vdXRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXHJcbiAgICAgICAgJzwvYnV0dG9uPicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xDdHJsKXtcclxuICAgICAgICAgIGxldCBtaW5MZXZlbCA9IGlzRmluaXRlKGF0dHJzLm1pbikgPyBOdW1iZXIucGFyc2VJbnQoYXR0cnMubWluKSA6IDA7XHJcbiAgICAgICAgICBsZXQgbWF4TGV2ZWwgPSBpc0Zpbml0ZShhdHRycy5tYXgpID8gTnVtYmVyLnBhcnNlSW50KGF0dHJzLm1heCkgOiAxMDA7XHJcblxyXG4gICAgICAgICAgaWYobWluTGV2ZWwgPCAwIHx8IG1heExldmVsIDwgMCB8fCBtaW5MZXZlbCA+PSBtYXhMZXZlbCl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm1pbiBvciBtYXggYXR0cnMgdmFsdWUgYXJlIGludmFsaWQuXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBsZXZlbFZhbHVlID0gOTAgLyAobWF4TGV2ZWwgLSBtaW5MZXZlbCk7XHJcbiAgICAgICAgICBsZXQgY3VycmVudExldmVsID0gKG1heExldmVsIC0gbWluTGV2ZWwpIC8gMjtcclxuICAgICAgICAgIGxldCB6b29tTGV2ZWwgPSAobWF4TGV2ZWwgKyBtaW5MZXZlbCkgLyAyO1xyXG4gICAgICAgICAgbGV0IGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gNDU7XHJcblxyXG4gICAgICAgICAgbGV0IHBvaW50ZXIgID0gYW5ndWxhci5lbGVtZW50KGVsZW1lbnQuZmluZCgnc3BhbicpWzJdKTtcclxuICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlICsgJyUnKTtcclxuXHJcbiAgICAgICAgICBsZXQgY2xpZW50WSA9IG51bGw7XHJcbiAgICAgICAgICBsZXQgYmFySGVpZ2h0ID0gcG9pbnRlclswXS5jbGllbnRIZWlnaHQgKiAxMDtcclxuICAgICAgICAgIGxldCBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcclxuXHJcbiAgICAgICAgICBwb2ludGVyLm9uKCdtb3VzZWRvd24nLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgICAgICBzdGFydFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50UG9pbnRlckhlaWdodDtcclxuICAgICAgICAgICAgcG9pbnRlci5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNsaWVudFkgIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgIGNsaWVudFkgPSBudWxsO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHpvb21MZXZlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZihjbGllbnRZICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICBsZXQgZGVsdGFZID0gY2xpZW50WSAtIGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgICAgICAgbGV0IHBlcmNlbnQgPSAoTWF0aC5hYnMoZGVsdGFZKSAqIDEwMCAvIGJhckhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgIGlmKGRlbHRhWSA+IDApe1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhcnRQb2ludGVySGVpZ2h0IC0gcGVyY2VudCA+PSAwKXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBzdGFydFBvaW50ZXJIZWlnaHQgLSBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRQb2ludGVySGVpZ2h0ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGlmKHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQgPD0gOTApe1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IHN0YXJ0UG9pbnRlckhlaWdodCArIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSA5MDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbCA9IE1hdGgudHJ1bmMoY3VycmVudFBvaW50ZXJIZWlnaHQgLyBsZXZlbFZhbHVlKTtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwgPSBtYXhMZXZlbCAtIGN1cnJlbnRMZXZlbDtcclxuICAgICAgICAgICAgICBwb2ludGVyLmNzcygndG9wJywgY3VycmVudExldmVsICogbGV2ZWxWYWx1ZSArICclJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHNjb3BlLnpvb21JbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHpvb21MZXZlbCA8IG1heExldmVsKXtcclxuICAgICAgICAgICAgICB6b29tTGV2ZWwrKztcclxuICAgICAgICAgICAgICBjdXJyZW50TGV2ZWwtLTtcclxuICAgICAgICAgICAgICBjdXJyZW50UG9pbnRlckhlaWdodCA9IGN1cnJlbnRMZXZlbCAqIGxldmVsVmFsdWU7XHJcbiAgICAgICAgICAgICAgcG9pbnRlci5jc3MoJ3RvcCcsIGN1cnJlbnRQb2ludGVySGVpZ2h0ICsgJyUnKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyh6b29tTGV2ZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLnpvb21PdXQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZih6b29tTGV2ZWwgPiBtaW5MZXZlbCl7XHJcbiAgICAgICAgICAgICAgem9vbUxldmVsLS07XHJcbiAgICAgICAgICAgICAgY3VycmVudExldmVsKys7XHJcbiAgICAgICAgICAgICAgY3VycmVudFBvaW50ZXJIZWlnaHQgPSBjdXJyZW50TGV2ZWwgKiBsZXZlbFZhbHVlO1xyXG4gICAgICAgICAgICAgIHBvaW50ZXIuY3NzKCd0b3AnLCBjdXJyZW50UG9pbnRlckhlaWdodCArICclJyk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coem9vbUxldmVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KHdpbmRvdy5hbmd1bGFyKSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==