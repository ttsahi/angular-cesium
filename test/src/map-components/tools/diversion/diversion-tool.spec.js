/**
 * Created by erezy on 08/02/15.
 */

'use strict';

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('map-components', function(){
    describe('tools', function(){
      describe('diversion', function(){
        describe('diversion-tool', function(){

          var $compile,$scope;
          beforeEach(inject(function(_$rootScope_,_$compile_,_$document_,DiversionTool){
            $compile = _$compile_;
            $scope = _$rootScope_.$new();
            $scope.diversionTool = DiversionTool;
          }));

          var diversionTool,canvas,elem;

          beforeEach(inject(function(){
            elem = angular.element('<map><toolbar><tool type="diversionTool"></tool></toolbar></map>');
            elem = $compile(elem)($scope);
            $scope.$digest();
            var elemTool = angular.element(elem.find('tool')[0].children[0]);
            diversionTool = elemTool.scope().tool;
            canvas = diversionTool._canvas;

          }));

          it('enableRotate should be true', function(){
            diversionTool.start();
            expect(diversionTool._scene.screenSpaceCameraController.enableRotate).toBe(true);
          });
          it('The cursor on canvas should be "-webkit-grab"', function(){
            diversionTool.start();
            expect(angular.element(canvas).css('cursor')).toEqual('-webkit-grab');
          });

          it('enableRotate should be false', function(){
            diversionTool.stop();
            expect(diversionTool._scene.screenSpaceCameraController.enableRotate).toBe(false);
          });
          it('The cursor on canvas should be "initial"', function(){
            diversionTool.stop();
            expect(angular.element(canvas).css('cursor')).toEqual('initial');
          });

        });
      });
    });
  });
});
