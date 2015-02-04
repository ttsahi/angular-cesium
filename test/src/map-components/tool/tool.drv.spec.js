/**
 * Created by tzachit on 04/02/15.
 */

'use strict';

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('map-components', function(){
    describe('tool', function(){
      describe('tool directive', function(){

        var $compile, $rootScope, Tool;

        beforeEach(inject(function(_$compile_, _$rootScope_, _Tool_){
          $compile = _$compile_;
          $rootScope = _$rootScope_;
          Tool = _Tool_;
        }));

        it('should be child of toolbar directive.', function(){
          $rootScope.tool = Tool;
          expect(function(){ $compile('<tool type="tool"></tool>')($rootScope); }).toThrow();
        });

        it('should throw exception when set type attribute to non function value.', function(){
          expect(function(){ $compile('<map></map><toolbar><tool type=""></tool></toolbar></map>')($rootScope); }).toThrow();
        });

        it('should create proxy of the given tool on the scope.', function(){
          $rootScope.defaultTool = Tool;
          var element = $compile('<map><toolbar><tool type="defaultTool"></tool></toolbar></map>')($rootScope);
          var scope = angular.element(element.find('tool')[0]).scope();
          expect(scope.tool).toBeDefined();
          expect(scope.tool.start).toBeDefined();
          expect(scope.tool.stop).toBeDefined();
          expect(scope.tool.cancel).toBeDefined();
          expect(scope.tool.onUpdate).toBeDefined();
        });

        it('should append the transclude content to the dom.', function(){
          $rootScope.defaultTool = Tool;
          var element = $compile('<map><toolbar><tool type="defaultTool">Transclude Content</tool></toolbar></map>')($rootScope);
          expect(element.html()).toContain("Transclude Content");
        });
      });
    });
  });

});
