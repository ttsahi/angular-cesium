/**
 * Created by erezy on 2/1/2015.
 */
'use strict';
describe('src', function() {
  describe('map-components', function () {

    beforeEach(module('angularCesium'));

    describe('toolbar', function () {
      describe('draggable', function () {
        var $compile,$scope,elem;
        beforeEach(inject(function(_$rootScope_,_$compile_){
          $compile = _$compile_;
          $scope = _$rootScope_.$new();
          elem = angular.element('<map><toolbar></toolbar></map>');
          elem = $compile(elem)($scope);
          $scope.$digest();
        }));

        it('html should contain drag-button class',function (){
          expect(elem.html()).toContain("drag-button");
        });

        describe('mousedown event', function () {
          var toolbarElem,draggableElem,toolbarScope;
          beforeEach(function(){
            toolbarElem = angular.element(elem.find('div')[1]);
            draggableElem = angular.element(elem.find('div')[2]);
            toolbarScope  = toolbarElem.scope();
            spyOn(toolbarScope,'mapRect').and.callFake(function() { return {top:0,left:0,right:1000,bottom:500};});
          });
          it('mapRect should be called',function (){
            draggableElem.triggerHandler('mousedown');
            expect(toolbarScope.mapRect).toHaveBeenCalled();
          });
          it('getBoundingClientRect should be called',function (){
            spyOn(toolbarElem[0],'getBoundingClientRect').and.returnValue({height: 100, width: 50, left: 0, bottom: 100, right: 50, top: 0});
            draggableElem.triggerHandler('mousedown');
            expect(toolbarElem[0].getBoundingClientRect).toHaveBeenCalled();
          });
          it('draggableElem should contain drag-button class',function (){
            draggableElem.triggerHandler('mousedown');
            expect(draggableElem.css('cursor')).toEqual("-webkit-grabbing");
          });
          describe('mousemove event', function () {
            var $document
            beforeEach(inject(function(_$document_){
              $document = _$document_;

            }));
            afterEach(function(){
              $document.triggerHandler('mouseup');
            });
            it('toolbar should move',function (){
              spyOn(toolbarElem[0],'getBoundingClientRect').and.returnValue({height: 100, width: 50, left: 0, bottom: 400, right: 50, top: 0});
              draggableElem.triggerHandler({ type: 'mousedown', pageX: 0, pageY:0 });
              $document.triggerHandler({ type: 'mousemove', pageX: 20, pageY:50 });
              expect(toolbarElem.css('top')).toEqual('50px');
              expect(toolbarElem.css('left')).toEqual('20px');
            });
            it('toolbar should NOT move bottom',function(){
              spyOn(toolbarElem[0],'getBoundingClientRect').and.returnValue({height: 100, width: 50, left: 0, bottom: 550, right: 50, top: 0});
              draggableElem.triggerHandler({ type: 'mousedown', pageX: 0, pageY:0 });
              $document.triggerHandler({ type: 'mousemove', pageX: 20, pageY:450 });
              expect(toolbarElem.css('top')).toEqual('0px');
              expect(toolbarElem.css('left')).toEqual('0px');
            });
            it('toolbar should NOT move right',function(){
              spyOn(toolbarElem[0],'getBoundingClientRect').and.returnValue({height: 100, width: 50, left: 900, bottom: 400, right: 1200, top: 0});
              draggableElem.triggerHandler({ type: 'mousedown', pageX: 0, pageY:0 });
              $document.triggerHandler({ type: 'mousemove', pageX: 20, pageY:450 });
              expect(toolbarElem.css('top')).toEqual('0px');
              expect(toolbarElem.css('left')).toEqual('0px');
            });
            it('toolbar should NOT move left',function(){
              spyOn(toolbarElem[0],'getBoundingClientRect').and.returnValue({height: 100, width: 50, left: -100, bottom: 400, right: 50, top: 0});
              draggableElem.triggerHandler({ type: 'mousedown', pageX: 0, pageY:0 });
              $document.triggerHandler({ type: 'mousemove', pageX: 20, pageY:450 });
              expect(toolbarElem.css('top')).toEqual('0px');
              expect(toolbarElem.css('left')).toEqual('0px');
            });
            it('toolbar should NOT move up',function(){
              spyOn(toolbarElem[0],'getBoundingClientRect').and.returnValue({height: 100, width: 50, left: 0, bottom: 400, right: 50, top: -100});
              draggableElem.triggerHandler({ type: 'mousedown', pageX: 0, pageY:0 });
              $document.triggerHandler({ type: 'mousemove', pageX: 20, pageY:450 });
              expect(toolbarElem.css('top')).toEqual('0px');
              expect(toolbarElem.css('left')).toEqual('0px');
            });
            describe('mouseup event', function () {
              it('draggableElem should contain drag-button class',function (){
                draggableElem.triggerHandler('mousedown');
                $document.triggerHandler('mouseup');
                expect(draggableElem.css('cursor')).toEqual("-webkit-grab");
              });
            });
          });
        });
      });
    });
  });
});
