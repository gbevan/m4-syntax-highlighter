/*jslint regexp: true, vars: true*/
// vim:ai:ts=2:sw=2:sts=2:et

/*global define,brackets,console */
define(function (require, exports, module) {
  'use strict';

  // For integration with Brackets' LanguageManager
  var LanguageManager = brackets.getModule("language/LanguageManager");
  var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

  CodeMirror.defineMode("m4", function () {
    console.log('in defineMode m4');

    // https://www.gnu.org/software/m4/manual/m4.html#Syntax

    // Start it all
    return {
      startState: function () {
        var state = {};
        state.dunno = false;
        console.log('in startState');
        return state;
      },

      token: function (stream, state) {
        // Strip the spaces
        if (stream.eatSpace()) {
          return null;
        }

        // Go through the main process
        //return tokenize(stream, state);
        console.log('in token');
        if (stream.match(/^dnl /, false)) {
          //console.log('in dnl');
          //stream.skipToEnd();
          return "comment";
        }
        stream.eat(/./);
        return null;
      }
    };

  });
  // Register with Brackets
  LanguageManager.defineLanguage("m4", {
    name: "m4",
    mode: "m4",
    fileExtensions: ["m4", "ac"],
    lineComment: ["#", "dnl"]
  });

});


