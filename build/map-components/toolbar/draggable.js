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