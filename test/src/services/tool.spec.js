/**
 * Created by tzachit on 04/02/15.
 */

'use strict';

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('services', function(){
    describe('Tool', function(){

      var Tool;

      beforeEach(inject(function(_Tool_){
        Tool = _Tool_;
      }));

      it('Tool should be constructor.', function(){
        expect(typeof Tool).toBe('function');
      });

      describe('methods', function(){

        var tool;

        beforeEach(function(){
          tool = new Tool();
        });

        describe('start', function(){
          it('should throw no implementation exception.', function(){
            expect(function(){ tool.start(); }).toThrow();
          });
        });

        describe('stop', function(){
          it('should throw no implementation exception.', function(){
            expect(function(){ tool.stop(); }).toThrow();
          });
        });

        describe('cancel', function(){
          it('should throw no implementation exception.', function(){
            expect(function(){ tool.cancel(); }).toThrow();
          });
        });

        describe('onUpdate', function(){
          it('should throw no implementation exception.', function(){
            expect(function(){ tool.onUpdate(); }).toThrow();
          });
        });
      });
    });
  });
});
