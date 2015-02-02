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
      transclude: true,
      template: '<div ng-transclude=""></div>',
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
      require: '^toolBar',
      template: '<div ng-include="template"></div>',
      scope: {
        class: '=',
        template: '@'
      },
      link: function(scope, element, attrs, toolBarCtrl) {
        if (!(typeof scope.class === 'function')) {
          throw new TypeError("class attr must be constructor.");
        }
        var tool = new scope.class(toolBarCtrl.getCesiumWidget());
        if (!(tool instanceof Tool)) {
          throw new TypeError("tool must be instance of Tool.");
        }
        var proxy = {};
        var $__1 = function(key) {
          if (key === 'start') {
            return 0;
          }
          Object.defineProperty(proxy, key, {
            get: function() {
              return tool[key];
            },
            set: function(val) {
              tool[key] = val;
            }
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
        Object.defineProperty(proxy, 'start', {get: function() {
            return (function() {
              toolBarCtrl.startTool(tool);
            });
          }});
        scope.tool = proxy;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi5qcyIsInNlcnZpY2VzL2JpbGxib2FyZC1hdHRycy5qcyIsInNlcnZpY2VzL2Nlc2l1bS5qcyIsInNlcnZpY2VzL3Rvb2wuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmRzLWxheWVyL2JpbGxib2FyZHMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy9iaWxsYm9hcmQvYmlsbGJvYXJkLmpzIiwibWFwLWNvbXBvbmVudHMvY29tcGxleC1sYXllci9jb21wbGV4LWxheWVyLmpzIiwibWFwLWNvbXBvbmVudHMvbGFiZWxzLWxheWVyL2xhYmVscy1sYXllci5qcyIsIm1hcC1jb21wb25lbnRzL2xhYmVsL2xhYmVsLmpzIiwibWFwLWNvbXBvbmVudHMvbWFwL21hcC1kaXJlY3RpdmUuanMiLCJtYXAtY29tcG9uZW50cy9wb2x5bGluZS9wb2x5bGluZS5qcyIsIm1hcC1jb21wb25lbnRzL3BvbHlsaW5lcy1sYXllci9wb2x5bGluZXMtbGF5ZXIuanMiLCJtYXAtY29tcG9uZW50cy90b29sL3Rvb2wtYmFyLmRydi5qcyIsIm1hcC1jb21wb25lbnRzL3Rvb2wvdG9vbC5kcnYuanMiLCJtYXAtY29tcG9uZW50cy93ZWItbWFwLXNlcnZpY2UtbGF5ZXIvd2ViLW1hcC1zZXJ2aWNlLWxheWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYW5ndWxhci1jZXNpdW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nLCBbJ29ic2VydmFibGVDb2xsZWN0aW9uJ10pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMTAvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLnNlcnZpY2UoJ0JpbGxCb2FyZEF0dHJpYnV0ZXMnLCBmdW5jdGlvbigkcGFyc2UpIHtcclxuICB0aGlzLmNhbGNBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMsIGNvbnRleHQpIHtcclxuICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgIGltYWdlIDogJHBhcnNlKGF0dHJzLmltYWdlKShjb250ZXh0KVxyXG4gICAgfTtcclxuICAgIHZhciBwb3NpdGlvbkF0dHIgPSAkcGFyc2UoYXR0cnMucG9zaXRpb24pKGNvbnRleHQpO1xyXG4gICAgcmVzdWx0LnBvc2l0aW9uID0gQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uQXR0ci5sYXRpdHVkZSkgfHwgMCwgTnVtYmVyKHBvc2l0aW9uQXR0ci5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbkF0dHIuYWx0aXR1ZGUpIHx8IDApO1xyXG5cclxuICAgIHZhciBjb2xvciA9ICRwYXJzZShhdHRycy5jb2xvcikoY29udGV4dCk7XHJcbiAgICBpZiAoY29sb3IpIHtcclxuICAgICAgcmVzdWx0LmNvbG9yID0gQ2VzaXVtLkNvbG9yLmZyb21Dc3NDb2xvclN0cmluZyhjb2xvcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDEwLzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5mYWN0b3J5KCdDZXNpdW0nLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gQ2VzaXVtO1xyXG59KTtcclxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHR6YWNoaXQgb24gMDEvMDIvMTUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4oZnVuY3Rpb24oYW5ndWxhcil7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZmFjdG9yeSgnVG9vbCcsIFtcbiAgICBmdW5jdGlvbigpe1xuXG4gICAgICBjbGFzcyBUb29sIHtcbiAgICAgICAgY29uc3RydWN0b3IobWFwKXsgdGhpcy5fbWFwID0gbWFwOyB9XG4gICAgICAgIHN0YXJ0KCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxuICAgICAgICBzdG9wKCl7IHRocm93IFwiTm8gaW1wbGVtZW50YXRpb25cIjsgfVxuICAgICAgICBjYW5jZWwoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cbiAgICAgICAgb25VcGRhdGUoKXsgdGhyb3cgXCJObyBpbXBsZW1lbnRhdGlvblwiO31cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFRvb2w7XG4gICAgfVxuICBdKTtcblxufSh3aW5kb3cuYW5ndWxhcikpO1xuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdiaWxsYm9hcmRzTGF5ZXInLCBmdW5jdGlvbigkcGFyc2UsIE9ic2VydmFibGVDb2xsZWN0aW9uLCBCaWxsQm9hcmRBdHRyaWJ1dGVzLCBDZXNpdW0pIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSwgJGF0dHJzKSB7XHJcbiAgICAgIHRoaXMuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICgkYXR0cnMub2JzZXJ2YWJsZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGdldCBjb2xsZWN0aW9uIGlmIGxheWVyIGlzIGJvdW5kIHRvIE9ic2VydmFibGVDb2xsZWN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBsaW5rIDoge1xyXG4gICAgICBwcmU6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1hcEN0cmwpIHtcclxuICAgICAgICBzY29wZS5jb2xsZWN0aW9uID0gbmV3IENlc2l1bS5CaWxsYm9hcmRDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgaWYgKGF0dHJzLm9ic2VydmFibGVDb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICB2YXIgQ09MTEVDVElPTl9SRUdFWFAgPSAvXFxzKihbXFwkXFx3XVtcXCRcXHddKilcXHMraW5cXHMrKFtcXCRcXHddW1xcJFxcd10qKS87XHJcbiAgICAgICAgICB2YXIgbWF0Y2ggPSBhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbi5tYXRjaChDT0xMRUNUSU9OX1JFR0VYUCk7XHJcbiAgICAgICAgICB2YXIgaXRlbU5hbWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgIHZhciBjb2xsZWN0aW9uID0gJHBhcnNlKG1hdGNoWzJdKShzY29wZSk7XHJcbiAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24gaW5zdGFuY2VvZiBPYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ29ic2VydmFibGUtY29sbGVjdGlvbiBtdXN0IGJlIG9mIHR5cGUgT2JzZXJ2YWJsZUNvbGxlY3Rpb24uJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGFkZEJpbGxib2FyZCA9IGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHt9O1xyXG4gICAgICAgICAgICAgIGNvbnRleHRbaXRlbU5hbWVdID0gaXRlbTtcclxuICAgICAgICAgICAgICB2YXIgYmlsbERlc2MgPSBCaWxsQm9hcmRBdHRyaWJ1dGVzLmNhbGNBdHRyaWJ1dGVzKGF0dHJzLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgICAgc2NvcGUuY29sbGVjdGlvbi5hZGQoYmlsbERlc2MpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvbGxlY3Rpb24uZ2V0RGF0YSgpLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgYWRkQmlsbGJvYXJkKGl0ZW0pXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uQWRkKGFkZEJpbGxib2FyZCk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25VcGRhdGUoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uUmVtb3ZlKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgc2NvcGUuY29sbGVjdGlvbi5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbi5nZXQoaW5kZXgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMuYWRkKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLnJlbW92ZShzY29wZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnYmlsbGJvYXJkJywgZnVuY3Rpb24oQmlsbEJvYXJkQXR0cmlidXRlcykge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmJpbGxib2FyZHNMYXllcicsXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBiaWxsYm9hcmRzTGF5ZXJDdHJsKSB7XHJcbiAgICAgIHZhciBiaWxsRGVzYyA9IEJpbGxCb2FyZEF0dHJpYnV0ZXMuY2FsY0F0dHJpYnV0ZXMoYXR0cnMsIHNjb3BlKTtcclxuXHJcbiAgICAgIHZhciBiaWxsYm9hcmQgPSBiaWxsYm9hcmRzTGF5ZXJDdHJsLmdldEJpbGxib2FyZENvbGxlY3Rpb24oKS5hZGQoYmlsbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGJpbGxib2FyZHNMYXllckN0cmwuZ2V0QmlsbGJvYXJkQ29sbGVjdGlvbigpLnJlbW92ZShiaWxsYm9hcmQpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDE3LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ2NvbXBsZXhMYXllcicsIGZ1bmN0aW9uKCRsb2cpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3QgOiAnRScsXHJcbiAgICByZXF1aXJlIDogJ15tYXAnLFxyXG4gICAgY29tcGlsZSA6IGZ1bmN0aW9uKGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIGlmIChhdHRycy5vYnNlcnZhYmxlQ29sbGVjdGlvbikge1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50LmNoaWxkcmVuKCksIGZ1bmN0aW9uIChjaGlsZCkge1xyXG5cclxuICAgICAgICAgIHZhciBsYXllciA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICBpZiAoY2hpbGQudGFnTmFtZSA9PT0gJ0JJTExCT0FSRCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxiaWxsYm9hcmRzLWxheWVyPjwvYmlsbGJvYXJkcy1sYXllcj4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLnRhZ05hbWUgPT09ICdMQUJFTCcpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBhbmd1bGFyLmVsZW1lbnQoJzxsYWJlbHMtbGF5ZXI+PC9sYWJlbHMtbGF5ZXI+Jyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXllcikge1xyXG4gICAgICAgICAgICAkbG9nLndhcm4oJ0ZvdW5kIGFuIHVua25vd24gY2hpbGQgb2Ygb2YgY29tcGxleC1sYXllci4gUmVtb3ZpbmcuLi4nKTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGNoaWxkKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY2hpbGQuYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcclxuICAgICAgICAgICAgICBsYXllci5hdHRyKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudFswXS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG4gICAgICAgICAgICAgIGlmICghYW5ndWxhci5lbGVtZW50KGNoaWxkKS5hdHRyKGF0dHIubmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGxheWVyLmF0dHIoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoY2hpbGQpLnJlcGxhY2VXaXRoKGxheWVyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdsYWJlbHNMYXllcicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXm1hcCcsXHJcbiAgICBzY29wZSA6IHt9LFxyXG4gICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICB0aGlzLmdldExhYmVsQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkc2NvcGUuY29sbGVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbWFwQ3RybCkge1xyXG4gICAgICAgIHNjb3BlLmNvbGxlY3Rpb24gPSBuZXcgQ2VzaXVtLkxhYmVsQ29sbGVjdGlvbigpO1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5hZGQoc2NvcGUuY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBtYXBDdHJsLmdldENlc2l1bVdpZGdldCgpLnNjZW5lLnByaW1pdGl2ZXMucmVtb3ZlKHNjb3BlLmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgbmV0YW5lbCBvbiAwOS8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdsYWJlbCcsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXmxhYmVsc0xheWVyJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBjb2xvciA6ICcmJyxcclxuICAgICAgdGV4dCA6ICcmJyxcclxuICAgICAgcG9zaXRpb24gOiAnJidcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBsYWJlbHNMYXllckN0cmwpIHtcclxuICAgICAgdmFyIGxhYmVsRGVzYyA9IHt9O1xyXG5cclxuICAgICAgdmFyIHBvc2l0aW9uID0gc2NvcGUucG9zaXRpb24oKTtcclxuICAgICAgbGFiZWxEZXNjLnBvc2l0aW9uID0gQ2VzaXVtLkNhcnRlc2lhbjMuZnJvbURlZ3JlZXMoTnVtYmVyKHBvc2l0aW9uLmxhdGl0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24ubG9uZ2l0dWRlKSB8fCAwLCBOdW1iZXIocG9zaXRpb24uYWx0aXR1ZGUpIHx8IDApO1xyXG5cclxuICAgICAgdmFyIGNvbG9yID0gc2NvcGUuY29sb3IoKTtcclxuICAgICAgaWYgKGNvbG9yKSB7XHJcbiAgICAgICAgbGFiZWxEZXNjLmNvbG9yID0gY29sb3I7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxhYmVsRGVzYy50ZXh0ID0gc2NvcGUudGV4dCgpO1xyXG5cclxuICAgICAgdmFyIGxhYmVsID0gbGFiZWxzTGF5ZXJDdHJsLmdldExhYmVsQ29sbGVjdGlvbigpLmFkZChsYWJlbERlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxhYmVsc0xheWVyQ3RybC5nZXRMYWJlbENvbGxlY3Rpb24oKS5yZW1vdmUobGFiZWwpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBuZXRhbmVsIG9uIDA5LzAxLzE1LlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ21hcCcsIGZ1bmN0aW9uKCkge1xyXG4gIGZ1bmN0aW9uIGdldFNjZW5lTW9kZShkaW1lbnNpb25zKSB7XHJcbiAgICBpZiAoZGltZW5zaW9ucyA9PSAyKSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FMkQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChkaW1lbnNpb25zID09IDIuNSkge1xyXG4gICAgICByZXR1cm4gQ2VzaXVtLlNjZW5lTW9kZS5DT0xVTUJVU19WSUVXO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBDZXNpdW0uU2NlbmVNb2RlLlNDRU5FM0Q7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgdGVtcGxhdGUgOiAnPGRpdj4gPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPiA8ZGl2IGNsYXNzPVwibWFwLWNvbnRhaW5lclwiPjwvZGl2PiA8L2Rpdj4nLFxyXG4gICAgdHJhbnNjbHVkZSA6IHRydWUsXHJcbiAgICBzY29wZSA6IHtcclxuICAgICAgZGltZW5zaW9ucyA6ICdAJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJHNjb3BlLmNlc2l1bTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxpbmsgOiB7XHJcbiAgICAgIHByZTogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgaWYgKCFzY29wZS5kaW1lbnNpb25zKSB7XHJcbiAgICAgICAgICBzY29wZS5kaW1lbnNpb25zID0gMztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNjb3BlLmNlc2l1bSA9IG5ldyBDZXNpdW0uQ2VzaXVtV2lkZ2V0KGVsZW1lbnQuZmluZCgnZGl2JylbMF0sIHtcclxuICAgICAgICAgIHNjZW5lTW9kZTogZ2V0U2NlbmVNb2RlKHNjb3BlLmRpbWVuc2lvbnMpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ2lsbmlzMiBvbiAxOC8wMS8xNS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCdwb2x5bGluZScsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdCA6ICdFJyxcclxuICAgIHJlcXVpcmUgOiAnXnBvbHlsaW5lc0xheWVyJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICBjb2xvciA6ICcmJyxcclxuICAgICAgd2lkdGggOiAnJicsXHJcbiAgICAgIHBvc2l0aW9ucyA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGxpbmsgOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBvbHlsaW5lc0xheWVyQ3RybCkge1xyXG4gICAgICB2YXIgcG9seWxpbmVEZXNjID0ge307XHJcblxyXG4gICAgICBpZiAoIWFuZ3VsYXIuaXNEZWZpbmVkKHNjb3BlLnBvc2l0aW9ucykgfHwgIWFuZ3VsYXIuaXNGdW5jdGlvbihzY29wZS5wb3NpdGlvbnMpKXtcclxuICAgICAgICB0aHJvdyBcIlBvbHlsaW5lIHBvc2l0aW9ucyBtdXN0IGJlIGRlZmluZWQgYXMgYSBmdW5jdGlvblwiO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBwb3NpdGlvbnMgPSBzY29wZS5wb3NpdGlvbnMoKTtcclxuICAgICAgcG9seWxpbmVEZXNjLnBvc2l0aW9ucyA9IFtdO1xyXG4gICAgICBhbmd1bGFyLmZvckVhY2gocG9zaXRpb25zLCBmdW5jdGlvbihwb3NpdGlvbikge1xyXG4gICAgICAgIHBvbHlsaW5lRGVzYy5wb3NpdGlvbnMucHVzaChDZXNpdW0uQ2FydGVzaWFuMy5mcm9tRGVncmVlcyhOdW1iZXIocG9zaXRpb24ubGF0aXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5sb25naXR1ZGUpIHx8IDAsIE51bWJlcihwb3NpdGlvbi5hbHRpdHVkZSkgfHwgMCkpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBjZXNpdW1Db2xvciA9IENlc2l1bS5Db2xvci5mcm9tQ3NzQ29sb3JTdHJpbmcoJ2JsYWNrJyk7XHJcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChzY29wZS5jb2xvcikgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLmNvbG9yKSl7XHJcbiAgICAgICAgY2VzaXVtQ29sb3IgPSBDZXNpdW0uQ29sb3IuZnJvbUNzc0NvbG9yU3RyaW5nKHNjb3BlLmNvbG9yKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgcG9seWxpbmVEZXNjLm1hdGVyaWFsID0gQ2VzaXVtLk1hdGVyaWFsLmZyb21UeXBlKCdDb2xvcicpO1xyXG4gICAgICBwb2x5bGluZURlc2MubWF0ZXJpYWwudW5pZm9ybXMuY29sb3IgPSBjZXNpdW1Db2xvcjtcclxuXHJcbiAgICAgIHBvbHlsaW5lRGVzYy53aWR0aCA9IDE7XHJcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChzY29wZS53aWR0aCkgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKHNjb3BlLndpZHRoKSl7XHJcbiAgICAgICAgcG9seWxpbmVEZXNjLndpZHRoID0gc2NvcGUud2lkdGgoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBvbHlsaW5lID0gcG9seWxpbmVzTGF5ZXJDdHJsLmdldFBvbHlsaW5lQ29sbGVjdGlvbigpLmFkZChwb2x5bGluZURlc2MpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHBvbHlsaW5lc0xheWVyQ3RybC5nZXRQb2x5bGluZUNvbGxlY3Rpb24oKS5yZW1vdmUocG9seWxpbmUpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBnaWxuaXMyIG9uIDE4LzAxLzE1LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2FuZ3VsYXJDZXNpdW0nKS5kaXJlY3RpdmUoJ3BvbHlsaW5lc0xheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge30sXHJcbiAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuZ2V0UG9seWxpbmVDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbGluayA6IHtcclxuICAgICAgcHJlOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgICAgc2NvcGUuY29sbGVjdGlvbiA9IG5ldyBDZXNpdW0uUG9seWxpbmVDb2xsZWN0aW9uKCk7XHJcbiAgICAgICAgbWFwQ3RybC5nZXRDZXNpdW1XaWRnZXQoKS5zY2VuZS5wcmltaXRpdmVzLmFkZChzY29wZS5jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUucHJpbWl0aXZlcy5yZW1vdmUoc2NvcGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cbiAqL1xuXG4oZnVuY3Rpb24oYW5ndWxhcil7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sQmFyJywgW1xuICAgIGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXF1aXJlOiAnXm1hcCcsXG4gICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBuZy10cmFuc2NsdWRlPVwiXCI+PC9kaXY+JyxcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLFxuICAgICAgICAgIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRUb29sID0gbnVsbDtcblxuICAgICAgICAgICAgdGhpcy5nZXRDZXNpdW1XaWRnZXQgPSAoKSA9PiAkc2NvcGUuZ2V0Q2VzaXVtV2lkZ2V0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuc3RhcnRUb29sID0gZnVuY3Rpb24odG9vbCl7XG4gICAgICAgICAgICAgIGlmKGN1cnJlbnRUb29sICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICBjdXJyZW50VG9vbC5zdG9wKCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjdXJyZW50VG9vbCA9IHRvb2w7XG4gICAgICAgICAgICAgIGN1cnJlbnRUb29sLnN0YXJ0KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbGluazoge1xuICAgICAgICAgIHByZTogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKXtcbiAgICAgICAgICAgIHNjb3BlLmdldENlc2l1bVdpZGdldCA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xuXG59KHdpbmRvdy5hbmd1bGFyKSk7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgdHphY2hpdCBvbiAwMS8wMi8xNS5cbiAqL1xuXG4oZnVuY3Rpb24oYW5ndWxhcil7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyQ2VzaXVtJykuZGlyZWN0aXZlKCd0b29sJywgWydUb29sJyxcbiAgICBmdW5jdGlvbihUb29sKXtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmU6ICdedG9vbEJhcicsXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBuZy1pbmNsdWRlPVwidGVtcGxhdGVcIj48L2Rpdj4nLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgIGNsYXNzOiAnPScsXG4gICAgICAgICAgdGVtcGxhdGU6ICdAJ1xuICAgICAgICB9LFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRvb2xCYXJDdHJsKXtcbiAgICAgICAgICBpZighKHR5cGVvZiBzY29wZS5jbGFzcyA9PT0gJ2Z1bmN0aW9uJykpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImNsYXNzIGF0dHIgbXVzdCBiZSBjb25zdHJ1Y3Rvci5cIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRvb2wgPSBuZXcgc2NvcGUuY2xhc3ModG9vbEJhckN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkpO1xuXG4gICAgICAgICAgaWYoISh0b29sIGluc3RhbmNlb2YgVG9vbCkpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRvb2wgbXVzdCBiZSBpbnN0YW5jZSBvZiBUb29sLlwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgcHJveHkgPSB7fTtcblxuICAgICAgICAgIGZvcihsZXQga2V5IGluIHRvb2wpe1xuICAgICAgICAgICAgaWYoa2V5ID09PSAnc3RhcnQnKXtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksIGtleSwge1xuICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiB0b29sW2tleV07IH0sXG4gICAgICAgICAgICAgIHNldDogZnVuY3Rpb24odmFsKXsgdG9vbFtrZXldID0gdmFsOyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJveHksICdzdGFydCcsIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHsgdG9vbEJhckN0cmwuc3RhcnRUb29sKHRvb2wpOyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgc2NvcGUudG9vbCA9IHByb3h5O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbn0od2luZG93LmFuZ3VsYXIpKTtcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IG5ldGFuZWwgb24gMDkvMDEvMTUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYW5ndWxhckNlc2l1bScpLmRpcmVjdGl2ZSgnd2ViTWFwU2VydmljZUxheWVyJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgcmVxdWlyZSA6ICdebWFwJyxcclxuICAgIHNjb3BlIDoge1xyXG4gICAgICB1cmwgOiAnJicsXHJcbiAgICAgIGxheWVycyA6ICcmJ1xyXG4gICAgfSxcclxuICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgIH0sXHJcbiAgICBsaW5rIDogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtYXBDdHJsKSB7XHJcbiAgICAgIHZhciBwcm92aWRlciA9IG5ldyBDZXNpdW0uV2ViTWFwU2VydmljZUltYWdlcnlQcm92aWRlcih7XHJcbiAgICAgICAgdXJsOiBzY29wZS51cmwoKSxcclxuICAgICAgICBsYXllcnMgOiBzY29wZS5sYXllcnMoKVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBsYXllciA9IG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5hZGRJbWFnZXJ5UHJvdmlkZXIocHJvdmlkZXIpO1xyXG5cclxuICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIG1hcEN0cmwuZ2V0Q2VzaXVtV2lkZ2V0KCkuc2NlbmUuaW1hZ2VyeUxheWVycy5yZW1vdmUobGF5ZXIpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9