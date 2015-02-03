/**
 * Created by tzachit on 02/02/15.
 */

(function(angular){

  'use strict';

  angular.module('angularCesium').directive('zoomWidget', ['$document',
    function($document){
      return {
        replace: true,
        require: '^tool',
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
          let minLevel = isFinite(attrs.min) ? Number.parseInt(attrs.min) : 0;
          let maxLevel = isFinite(attrs.max) ? Number.parseInt(attrs.max) : 100;

          if(minLevel < 0 || maxLevel < 0 || minLevel >= maxLevel){
            throw new Error("min or max attrs value are invalid.");
          }

          let levelValue = 90 / (maxLevel - minLevel);
          let currentLevel = (maxLevel - minLevel) / 2;
          let zoomLevel = (maxLevel + minLevel) / 2;
          let currentPointerHeight = 45;

          let pointer  = angular.element(element.find('span')[2]);
          pointer.css('top', currentLevel * levelValue + '%');

          let clientY = null;
          let barHeight = pointer[0].clientHeight * 10;
          let startPointerHeight = currentPointerHeight;

          pointer.on('mousedown', event => {
            event.preventDefault();
            clientY = event.clientY;
            startPointerHeight = currentPointerHeight;
            pointer.addClass('active');
          });

          $document.on('mouseup', event => {
            if(clientY !== null){
              clientY = null;
              pointer.removeClass('active');
              console.log(zoomLevel);
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
              pointer.css('top', currentLevel * levelValue + '%');
            }
          });

          scope.zoomIn = function(){
            if(zoomLevel < maxLevel){
              zoomLevel++;
              currentLevel--;
              currentPointerHeight = currentLevel * levelValue;
              pointer.css('top', currentPointerHeight + '%');
              console.log(zoomLevel);
            }
          };

          scope.zoomOut = function(){
            if(zoomLevel > minLevel){
              zoomLevel--;
              currentLevel++;
              currentPointerHeight = currentLevel * levelValue;
              pointer.css('top', currentPointerHeight + '%');
              console.log(zoomLevel);
            }
          };
        }
      };
    }
  ]);

}(window.angular));