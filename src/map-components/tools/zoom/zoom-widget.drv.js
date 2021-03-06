/**
 * Created by tzachit on 02/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').directive('zoomWidget', ['$document',
    function($document){
      return {
        replace: true,
        require: '^^tool',
        template: '<div class="zoom-widget">' +
        '<div class="zoom-in-btn">' +
        '<button type="button" class="btn btn-default" ng-click="zoomIn();">' +
        '<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>' +
        '</button>' +
        '</div>' +
        '<div class="slider">' +
        '<span class="bar">' +
        '</span>' +
        '<span class="pointer">' +
        '</span>' +
        '</div>' +
        '<div class="zoom-out-btn">' +
        '<button type="button" class="btn btn-default" ng-click="zoomOut();">' +
        '<span class="glyphicon glyphicon-zoom-out" aria-hidden="true"></span>' +
        '</button>' +
        '</div>' +
        '</div>',
        link: function(scope, element, attrs, toolCtrl){
          if(!Number.parseInt(attrs.width) || !Number.parseInt(attrs.height)){
            let width =  Number.parseInt(attrs.width) ? `${Number.parseInt(attrs.width)}px` : 'inherit';
            let height =  Number.parseInt(attrs.height) ? `${Number.parseInt(attrs.height)}px` : 'inherit';
            element.css({position: 'relative', width: width, height: height});
          }

          let minLevel = !Object.is((Number.parseInt(attrs.min)),NaN) ? Number.parseInt(attrs.min) : 0;
          let maxLevel = !Object.is((Number.parseInt(attrs.max)),NaN)  ? Number.parseInt(attrs.max) : 100;

          if(minLevel < 0 || maxLevel < 0 || minLevel >= maxLevel){
            throw new Error("min or max attributes value are invalid.");
          }

          let startLevel = 0;

          if(!Object.is((startLevel = Number.parseInt(attrs.start)),NaN)){
            if(startLevel < minLevel || startLevel > maxLevel){
              throw new Error("Invalid start attribute value.");
            }
          }else{
            startLevel = Math.trunc((maxLevel + minLevel) / 2);
          }

          let jumps = isFinite(attrs.jump) ? Number.parseInt(attrs.jump) : 10;

          let zoomTool = toolCtrl.getTool();

          if((typeof zoomTool.zoomIn !== 'function') || (typeof zoomTool.zoomOut !== 'function')){
            throw new TypeError("Zoom widget must be inside tool with ZoomTool type.");
          }

          let levelValue = 90 / (maxLevel - minLevel);
          let currentLevel = (maxLevel - minLevel) - (startLevel - minLevel);
          let zoomLevel = startLevel;
          let tempLevel = zoomLevel;
          let currentPointerHeight = currentLevel * levelValue;

          let pointer  = angular.element(element.find('span')[2]);
          pointer.css('top', `${currentPointerHeight}%`);

          let clientY = null;
          let barHeight = pointer[0].clientHeight * 10;
          let startPointerHeight = currentPointerHeight;

          pointer.on('mousedown', event => {
            event.preventDefault();
            clientY = event.clientY;
            startPointerHeight = currentPointerHeight;
            tempLevel = zoomLevel;
            pointer.addClass('active');
          });

          $document.on('mouseup', event => {
            if(clientY !== null){
              clientY = null;
              pointer.removeClass('active');
            }
          });

          $document.on('mousemove', event => {
            if(clientY !== null){
              let deltaY = clientY - event.clientY;
              let percent = (Math.abs(deltaY) * 100 / barHeight);

              if(deltaY > 0){
                if(startPointerHeight - percent >= 0){
                  currentPointerHeight = startPointerHeight - percent;
                }else{
                  currentPointerHeight = 0;
                }
              }else{
                if(startPointerHeight + percent <= 90){
                  currentPointerHeight = startPointerHeight + percent;
                }else{
                  currentPointerHeight = 90;
                }
              }

              currentLevel = Math.trunc(currentPointerHeight / levelValue);
              zoomLevel = maxLevel - currentLevel;
              if(zoomLevel > tempLevel){
                zoomTool.zoomIn((zoomLevel - tempLevel) * jumps);
              }
              if(zoomLevel < tempLevel){
                zoomTool.zoomOut((tempLevel - zoomLevel) * jumps);
              }
              tempLevel = zoomLevel;
              pointer.css('top', `${currentLevel * levelValue}%`);
            }
          });

          scope.zoomIn = function(){
            if(zoomLevel < maxLevel){
              zoomLevel++;
              currentLevel--;
              currentPointerHeight = currentLevel * levelValue;
              pointer.css('top', `${currentPointerHeight}%`);
              zoomTool.zoomIn(jumps);
            }
          };

          scope.zoomOut = function(){
            if(zoomLevel > minLevel){
              zoomLevel--;
              currentLevel++;
              currentPointerHeight = currentLevel * levelValue;
              pointer.css('top', `${currentPointerHeight}%`);
              zoomTool.zoomOut(jumps);
            }
          };
        }
      };
    }
  ]);

}(window.angular));
