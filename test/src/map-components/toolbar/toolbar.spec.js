/**
 * Created by erezy on 01/02/15.
 */
'use strict';

describe('src', function(){
  describe('map-components', function(){

    beforeEach(module('angularCesium'));

    describe('toolbar', function(){

      var $compile,$scope,elem;
      beforeEach(inject(function(_$rootScope_,_$compile_){
        $compile = _$compile_;
        $scope = _$rootScope_.$new();
      }));

      it('check require map - false',function (){
        elem = angular.element('<toolbar></toolbar>');
        expect(function(){$compile(elem)($scope)}).toThrow();
      });
      it('check require map - true',function (){
        elem = angular.element('<map><toolbar></toolbar></map>');
        expect(function(){$compile(elem)($scope)}).not.toThrow();
      });
      it('html should contain div with class toolbar',function (){
        elem = $compile(angular.element('<map><toolbar></toolbar></map>'))($scope);
        $scope.$digest();
        expect(elem.html()).toContain('<div class="toolbar"');
      });
      describe('controller',function(){
        var ctrl,toolbarElem;
        beforeEach(function(){
          elem = $compile('<map><toolbar></toolbar></map>')($scope);
          $scope.$digest();
          elem.find('toolbar')
          toolbarElem = angular.element(elem.find('toolbar')[0]);
          ctrl = toolbarElem.controller('toolbar');
        });
        it('getCesiumWidget should NOT be undefined', function(){
          expect(ctrl.getCesiumWidget()).not.toBeUndefined(true);
        });
        it('mapRect should NOT be undefined', function(){
          expect(toolbarElem.scope().mapRect().constructor.name).toBe('ClientRect');
        });
        describe('startTool function', function(){
          var tool;
          beforeEach(inject(function(Tool){
            tool = new Tool(ctrl.getCesiumWidget());
            spyOn(tool,'start');
            spyOn(tool,'stop');
          }));
          it('startTool should call stop and start', function(){
            ctrl.startTool(tool);
            ctrl.startTool(tool);
            expect(tool.stop.calls.count()).toBe(1);
            expect(tool.start.calls.count()).toBe(2);
          });

        });
      });
    });
  });
});

