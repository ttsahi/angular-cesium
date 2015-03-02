/**
 * Created by erezy on 08/02/15.
 */

'use strict';

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('map-components', function(){
    describe('tools', function(){
      describe('center', function(){
        describe('center-tool', function(){

          var $compile,$scope;
          beforeEach(inject(function(_$rootScope_,_$compile_,_$document_,CenterTool){
            $compile = _$compile_;
            $scope = _$rootScope_.$new();
            $scope.centerTool = CenterTool;
          }));

          var centerTool,canvas,elem;

          beforeEach(inject(function(){
            elem = angular.element('<map><toolbar><tool type="centerTool"></tool></toolbar></map>');
            elem = $compile(elem)($scope);
            $scope.$digest();
            var elemTool = angular.element(elem.find('tool')[0].children[0]);
            centerTool = elemTool.scope().tool;
            canvas = centerTool._canvas;
            spyOn(centerTool._handler,'setInputAction');
            spyOn(centerTool._handler,'removeInputAction');
          }));

          it('enableRotate should be false', function(){
            centerTool.start();
            expect(centerTool._scene.screenSpaceCameraController.enableRotate).toBe(false);
          });
          it('The cursor on canvas should be "copy"', function(){
            centerTool.start();
            expect(angular.element(canvas).css('cursor')).toEqual('copy');
          });
          it('The function setInputAction  should be called', function(){
            centerTool.start();
            expect(centerTool._handler.setInputAction).toHaveBeenCalled();
          });

          it('enableRotate should be true', function(){
            centerTool.stop();
            expect(centerTool._scene.screenSpaceCameraController.enableRotate).toBe(true);
          });
          it('The cursor on canvas should be "initial"', function(){
            centerTool.stop();
            expect(angular.element(canvas).css('cursor')).toEqual('initial');
          });
          it('The function removeInputAction should be called', function(){
            centerTool.stop();
            expect(centerTool._handler.removeInputAction).toHaveBeenCalled();
          });

        });
      });
    });
  });
});
