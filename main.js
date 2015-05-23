/*jslint regexp: true, vars: true*/
// vim:ai:ts=2:sw=2:sts=2:et

/*global define,brackets,console */
define(function (require, exports, module) {
  'use strict';

  // For integration with Brackets' LanguageManager
  var LanguageManager = brackets.getModule("language/LanguageManager");
  var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

  CodeMirror.defineMode("m4", function () {

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    // https://www.gnu.org/software/m4/manual/m4.html#Syntax

    var self = {};

    self.tokenize = function (stream, state) {

      // Comments
      if (stream.match(/(#|dnl)(\s*|$)/, false)) {
        stream.skipToEnd();
        return 'comment';
      }

      if (state.inVariableAssignment && stream.peek() === '=') {
        stream.next();
        return null;
      }

      // Strings (single-line
      if (!state.inString) {
        var quoteMatch = stream.match(/("|'|\[)/);
        if (quoteMatch || state.inVariableAssignment) {
          state.pending = false;
          if (quoteMatch) {
            if (quoteMatch[1] === '[') {
              if (stream.match(/\s*$/, false)) {
                return null;
              }
              state.pending = ']';
            } else {
              state.pending = quoteMatch[1];
            }
          }
          state.inString = true;
        }
      }
      if (state.inString) {
        var current, prev = false;
        while (!stream.eol()) {
          current = stream.next();
          if (prev !== '\\' && current === state.pending) {
            break;
          }
          if ((state.macroStack.length > 0 || state.inVariableAssignment) && current.match(/[,)#]/) && !state.pending) {
            stream.backUp(1);
            break;
          }
          prev = current;
        }
        if (!state.pending || current === state.pending) {
          state.inString = false;
          if (state.inVariableAssignment) {
            state.inVariableAssignment = false;
          }
        }
        return 'string';
      }

      // Assignment: variable=value
      if (!state.inVariableAssignment && stream.sol()) {
        var varMatch = stream.match(/(^\s*)?(\w+)=/);
        if (varMatch) {
          stream.backUp(1);
          state.inVariableAssignment = true;
          state.variable[varMatch[1]] = true;
          return 'm4variable';
        }
      }

      // Variables $NAME
      if (stream.match(/^\$\w+/)) {
        return 'm4variable';
      }

      // Macro names
      if (state.macroStack.length > 0) {
        var bracketsMatch = stream.match(/(\(|\))/);
        if (bracketsMatch) {
          if (bracketsMatch[1] === ')') {
            state.macroStack.pop();
          }
          return 'bracket';
        }
        if (state.macroStack[state.macroStack.length - 1].match('^(AC_SUBST)$')) {
          var ac_subst_var = stream.match(/(\w+)/);
          if (ac_subst_var && state.variable[ac_subst_var[1]]) {
            return 'm4variable';
          }
          return null;
        }
      }
      var macroMatch = stream.match(/([_A-Z][_A-Z0-9]*|m4_\w+)(\s*$|\()/);
      if (macroMatch) {
        if (macroMatch[2] === '(') {
          stream.backUp(1);
        }
        state.macroStack.push(macroMatch[1]);
        return 'keyword';
      }

      // Strip the spaces
      /*
      if (stream.eatSpace()) {
        return null;
      }
      */

      // eat the rest
      stream.eat(/./);
      return null;
    };

    // Start it all
    return {
      startState: function () {
        var state = {};
        state.macroStack = [];

        state.inString = false;
        state.pending = false;

        state.inVariableAssignment = false;

        state.variable = {};

        return state;
      },

      token: self.tokenize

    };

  });
  // Register with Brackets
  LanguageManager.defineLanguage("m4", {
    name: "m4",
    mode: "m4",
    fileExtensions: ["m4", "ac"],
    lineComment: ["#", "dnl "]
  });

});
