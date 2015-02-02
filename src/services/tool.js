/**
 * Created by tzachit on 01/02/15.
 */

'use strict';

(function(angular){

  'use strict';

  angular.module('angularCesium').factory('Tool', [
    function(){

      class Tool {
        constructor(map){ this._map = map; }
        start(){ throw "No implementation"; }
        stop(){ throw "No implementation"; }
        cancel(){ throw "No implementation";}
        onUpdate(){ throw "No implementation";}
      }

      return Tool;
    }
  ]);

}(window.angular));
