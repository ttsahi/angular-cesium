/**
 * Created by tzachit on 04/02/15.
 */

'use strict';

describe('src', function(){

  beforeEach(module('angularCesium'));

  describe('services', function(){
    describe('tool', function(){

      var Tool;

      beforeEach(inject(function(_Tool_){
        Tool = _Tool_;
      }));

      it('Tool class should be exist.', function(){
        expect(typeof Tool).toBe('function');
      });
    });
  });
});
