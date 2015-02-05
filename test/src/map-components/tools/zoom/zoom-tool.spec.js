/**
 * Created by tzachit on 05/02/15.
 */

'use strict';

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('map-components', function(){
    describe('tools', function(){
      describe('zoom', function(){
        describe('ZoomTool', function(){

          var zoomTool, camera, ellipsoid;

          beforeEach(inject(function(_Cesium_, ZoomTool){
            var map = new Cesium.CesiumWidget(document.createElement('div'));
            camera = map.scene.camera;
            ellipsoid = map.scene.globe.ellipsoid;
            zoomTool = new ZoomTool(map);
          }));

          it('should decrease the map camera height when invoke zoomIn(...) function.', function(){
            var currentCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
            zoomTool.zoomIn();
            var newCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
            expect(newCameraHeight).toBeLessThan(currentCameraHeight);
          });

          it('should increase the map camera height when invoke zoomOut(...) function.', function(){
            var currentCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
            zoomTool.zoomOut();
            var newCameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
            expect(newCameraHeight).toBeGreaterThan(currentCameraHeight);
          });
        });
      });
    });
  });
});
