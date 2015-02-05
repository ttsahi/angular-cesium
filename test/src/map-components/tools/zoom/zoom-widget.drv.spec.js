/**
 * Created by tzachit on 04/02/15.
 */

'use strict';

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('map-components', function(){
    describe('tools', function(){
      describe('zoom', function(){
        describe('zoom-widget directive', function(){

          var $compile, $rootScope, ZoomTool;

          beforeEach(inject(function(_$compile_, _$rootScope_, _ZoomTool_){
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            ZoomTool = _ZoomTool_;
          }));

          it('zoom widget element should have position relative when defined with valid width or height attributes.', function(){
            $rootScope.zoomTool = ZoomTool;
            var element = $compile('<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="10" width="50" height="100"></zoom-widget>' +
            '</tool></toolbar></map>')($rootScope);
            var zoomWidget = angular.element(element.find('tool')[0].children[0]);
            expect(zoomWidget.css('position')).toBe('relative');

            element = $compile('<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="10" width="50"></zoom-widget>' +
            '</tool></toolbar></map>')($rootScope);
            zoomWidget = angular.element(element.find('tool')[0].children[0]);
            expect(zoomWidget.css('position')).toBe('relative');

            element = $compile('<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="10" height="100"></zoom-widget>' +
            '</tool></toolbar></map>')($rootScope);
            zoomWidget = angular.element(element.find('tool')[0].children[0]);
            expect(zoomWidget.css('position')).toBe('relative');
          });

          it('zoom widget element should have position absolute when defined without width and height attributes.', function(){
            $rootScope.zoomTool = ZoomTool;
            var element = $compile('<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="10"></zoom-widget>' +
            '</tool></toolbar></map>')($rootScope);
            var zoomWidget = angular.element(element.find('tool')[0].children[0]);
            expect(zoomWidget.css('position')).toBe('');
          });

          it('zoom widget style should have specific width or height when defined with valid width or height attributes.', function(){
            $rootScope.zoomTool = ZoomTool;
            var element = $compile('<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="10" width="50" height="100"></zoom-widget>' +
            '</tool></toolbar></map>')($rootScope);
            var zoomWidget = angular.element(element.find('tool')[0].children[0]);
            expect(zoomWidget.css('width')).toBe('50px');
            expect(zoomWidget.css('height')).toBe('100px');

            element = $compile('<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="10" width="50"></zoom-widget>' +
            '</tool></toolbar></map>')($rootScope);
            zoomWidget = angular.element(element.find('tool')[0].children[0]);
            expect(zoomWidget.css('width')).toBe('50px');
            expect(zoomWidget.css('height')).toBe('inherit');

            element = $compile('<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="10" height="100"></zoom-widget>' +
            '</tool></toolbar></map>')($rootScope);
            zoomWidget = angular.element(element.find('tool')[0].children[0]);
            expect(zoomWidget.css('height')).toBe('100px');
            expect(zoomWidget.css('width')).toBe('inherit');
          });

          it('should throw error when defined with negative min or max attributes or min grater then max.', function(){
            $rootScope.zoomTool = ZoomTool;
            var html = '<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="0" max="-10" width="50" height="100"></zoom-widget>' +
            '</tool></toolbar></map>';
            expect(function(){ $compile(html)($rootScope); }).toThrow();

            html = '<map><toolbar><tool type="zoomTool">' +
              '<zoom-widget min="-2" max="10" width="50" height="100"></zoom-widget>' +
              '</tool></toolbar></map>';
            expect(function(){ $compile(html)($rootScope); }).toThrow();

            html = '<map><toolbar><tool type="zoomTool">' +
            '<zoom-widget min="10" max="0" width="50" height="100"></zoom-widget>' +
            '</tool></toolbar></map>';
            expect(function(){ $compile(html)($rootScope); }).toThrow();
          });

          it('should be child of tool directive with ZoomTool type.', inject(function(Tool){
            $rootScope.zoomTool = Tool;
            var html = '<map><toolbar><tool type="zoomTool">' +
              '<zoom-widget min="0" max="10" width="50" height="100"></zoom-widget>' +
              '</tool></toolbar></map>';
            expect(function(){ $compile(html)($rootScope); }).toThrow();
          }));

          describe('events', function(){

            var zoomWidget, camera, ellipsoid;

            beforeEach(function(){
              $rootScope.zoomTool = ZoomTool;
              var element = $compile('<map><toolbar><tool type="zoomTool">' +
              '<zoom-widget min="0" max="10" width="50" height="100"></zoom-widget>' +
              '</tool></toolbar></map>')($rootScope);
              var map = element.controller('map').getCesiumWidget();
              zoomWidget = angular.element(element.find('tool')[0].children[0]);
              camera = map.scene.camera;
              ellipsoid = map.scene.globe.ellipsoid;
            });

            it('should add css class active to pointer when mouse down.', function(){
              var pointer = angular.element(zoomWidget.find('span')[2]);
              pointer.triggerHandler('mousedown');
              expect(pointer.hasClass('active')).toBeTruthy();
            });

            it('should remove css class active from pointer when document mouse up.', inject(function($document){
              var pointer = angular.element(zoomWidget.find('span')[2]);
              pointer.triggerHandler('mousedown');
              expect(pointer.hasClass('active')).toBeTruthy();
              $document.triggerHandler('mouseup');
              expect(pointer.hasClass('active')).toBeFalsy();
            }));

            it('should decrease the map camera height when mouse move up on the bar.', inject(function($document){
              var pointer = angular.element(zoomWidget.find('span')[2]);
              var currentCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              pointer.triggerHandler({ type: 'mousedown', clientY: 50 });
              $document.triggerHandler({ type: 'mousemove', clientY: 20 });
              var newCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              expect(newCameraHeight).toBeLessThan(currentCameraHeight);
            }));

            it('should increase the map camera height when mouse move down on the bar.', inject(function($document){
              var pointer = angular.element(zoomWidget.find('span')[2]);
              var currentCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              pointer.triggerHandler({ type: 'mousedown', clientY: 50 });
              $document.triggerHandler({ type: 'mousemove', clientY: 70 });
              var newCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              expect(newCameraHeight).toBeGreaterThan(currentCameraHeight);
            }));

            it('should decrease the map camera height when click on zoom in button.', function(){
              var zoomInButton = angular.element(zoomWidget.find('button')[0]);
              var currentCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              zoomInButton.triggerHandler('click');
              var newCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              expect(newCameraHeight).toBeLessThan(currentCameraHeight);
            });

            it('should increase the map camera height when click on zoom out button.', function(){
              var zoomOutButton = angular.element(zoomWidget.find('button')[1]);
              var currentCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              zoomOutButton.triggerHandler('click');
              var newCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
              expect(newCameraHeight).toBeGreaterThan(currentCameraHeight);
            });
          });
        });
      });
    });
  });
});
