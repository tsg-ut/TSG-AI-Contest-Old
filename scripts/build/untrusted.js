function clone(obj) {
    if(obj == null || typeof(obj) != 'object')
        return obj;
    var temp = obj.constructor();
    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// from http://stackoverflow.com/questions/6466135/
function pad(str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}

Array.prototype.remove = function(item) {
    // TODO Update to use Array.prototype.indexOf
    for(var i = this.length; i--;) {
        if(this[i] === item) {
            this.splice(i, 1);
        }
    }
}

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

// Distance from point to line
// http://stackoverflow.com/a/6853926/2608804
function pDistance(x, y, x1, y1, x2, y2) {
    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = dot / len_sq;

    var xx, yy;

    if (param < 0 || (x1 == x2 && y1 == y2)) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * jQuery.fn.sortElements
 *
 * from http://james.padolsey.com/javascript/sorting-elements-with-jquery
 * --------------
 * @param Function comparator:
 *   Exactly the same behaviour as [1,2,3].sort(comparator)
 *
 * @param Function getSortable
 *   A function that should return the element that is
 *   to be sorted. The comparator will run on the
 *   current collection, but you may want the actual
 *   resulting sort to occur on a parent or another
 *   associated element.
 *
 *   E.g. $('td').sortElements(comparator, function(){
 *      return this.parentNode;
 *   })
 *
 *   The <td>'s parent (<tr>) will be sorted instead
 *   of the <td> itself.
 */
jQuery.fn.sortElements = (function(){

    var sort = [].sort;

    return function(comparator, getSortable) {

        getSortable = getSortable || function(){return this;};

        var placements = this.map(function(){

            var sortElement = getSortable.call(this),
                parentNode = sortElement.parentNode,

                // Since the element itself will change position, we have
                // to have some way of storing its original position in
                // the DOM. The easiest way is to have a 'flag' node:
                nextSibling = parentNode.insertBefore(
                    document.createTextNode(''),
                    sortElement.nextSibling
                );

            return function() {

                if (parentNode === this) {
                    throw new Error(
                        "You can't sort elements if any one is a descendant of another."
                    );
                }

                // Insert before flag:
                parentNode.insertBefore(this, nextSibling);
                // Remove flag:
                parentNode.removeChild(nextSibling);

            };

        });

        return sort.call(this, comparator).each(function(i){
            placements[i].call(getSortable.call(this));
        });

    };

})();

// http://stackoverflow.com/a/20095486/2608804
function isNewerVersion(v1, v2) {
    "use strict";
    var v1parts = v1.split('.'), v2parts = v2.split('.');
    var maxLen = Math.max(v1parts.length, v2parts.length);
    var part1, part2;
    var cmp = 0;
    for (var i = 0; i < maxLen && !cmp; i++) {
        part1 = parseInt(v1parts[i], 10) || 0;
        part2 = parseInt(v2parts[i], 10) || 0;
        if (part1 < part2)
            cmp = 1;
        if (part1 > part2)
            cmp = -1;
    }
    return (0 > cmp);
};

// returns random integers including from and to
var randInt = function (from, to) {
    return Math.floor(Math.random() * (to - from + 1)) + from;
};

var privates = {};

(function () {

function Game(debugMode, challenge) {
    var game = this;

    this._debugMode = debugMode;

    this._challenge = {};
    this._challenge.name = challenge;

    this.waitTime = 300;

    this._loadChallenge = function () {
        return $.when(
            $.ajax({
                url: 'challenges/' + game._challenge.name + '/umpire.js',
                dataType: 'script'
            }),
            $.ajax({
                url: 'challenges/' + game._challenge.name + '/contestant.js',
                dataType: 'text',
                success: function (data) {
                    game._challenge.contestant = data;
                }
            })
        );
    };

    this._validateChallenge = function () {
        try {
            var test = new Umpire();
            delete test;
            return true;
        } catch (e) {
            game._log('Challenge validation failed.');
            return false;
        }
    }

    this._execute = function () {
        var code = this.editor.getCode();

        var validatedAct = this.validate(code);

        game.waitTime = $('#waitTime').spinner('value');

        if (validatedAct) {
            privates.umpire.playGame(validatedAct, function () {
                return randInt(1, 3);
            })
        }
    };

    this._log = function (text) {
        var time = new Date();
        var hh = pad(time.getHours(), 2);
        var mm = pad(time.getMinutes(), 2);
        var ss = pad(time.getSeconds(), 2);
        var lll = pad(time.getMilliseconds(), 3);
        $('#log').append('[' + hh + ':' + mm + ':' + ss + '.' + lll + '] ' + text);
        $('#log').append('\n');
        $('#log').scrollTop(1000000);
        console.log(text);
    };

    this._eval = window.eval; // store our own copy of eval so that we can override window.eval

    this.editor = new CodeEditor("editor", 400, 300, this);

    this._globalVars = []; // keep track of current global variables
    for (p in window) {
        if (window.propertyIsEnumerable(p)) {
            this._globalVars.push(p);
        }
    }

    // load challenge scripts
    this._loadChallenge().done(function () {
        if (game._validateChallenge()) {
            game._log('Challenge loaded and validated.');
            privates.umpire = new Umpire();
            game.enableButtons();
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        game._log(errorThrown);
        game._log('Loading challenge failed.');
    });
}
Game.prototype.enableShortcutKeys = function () {
    shortcut.add('ctrl+5', function () {
        $("#executeButton").click();
        return true;
    });
};

Game.prototype.enableButtons = function () {
    var game = this;

    $("#executeButton").click( function () {
        game._execute();
    });
};

$(document).ready(function () {
    $('#waitTime').spinner({
        step: 50,
        min: 0,
        max: 500,
        culture: 'ja'
    });
});


function CodeEditor(textAreaDomID, width, height, game) {
    var symbols = {
        'begin_line':'#BEGIN_EDITABLE#',
        'end_line':'#END_EDITABLE#',
        'begin_char':"#{#",
        'end_char': "#}#",
        'begin_properties':'#BEGIN_PROPERTIES#',
        'end_properties':'#END_PROPERTIES#',
        'start_start_level':'#START_OF_START_LEVEL#',
        'end_start_level':'#END_OF_START_LEVEL#'
    };

    var charLimit = 80;

    var properties = {}
    var editableLines = [];
    var editableSections = {};
    var lastChange = {};
    var startOfStartLevel = null;
    var endOfStartLevel = null;

    this.setEndOfStartLevel = function (eosl) {
        endOfStartLevel = eosl;
    }

    this.setEditableLines = function (el) {
        editableLines = el;
    }

    this.setEditableSections = function (es) {
        editableSections = es;
    }

    // for debugging purposes
    log = function (text) {
        if (game._debugMode) {
            console.log(text);
        }
    }

    // preprocesses code,determines the location
    // of editable lines and sections, loads properties
    function preprocess(codeString) {
        editableLines = [];
        editableSections = {};
        endOfStartLevel = null;
        startOfStartLevel = null;
        var propertiesString = '';

        var lineArray = codeString.split("\n");
        var inEditableBlock = false;
        var inPropertiesBlock = false;

        for (var i = 0; i < lineArray.length; i++) {
            var currentLine = lineArray[i];

            // process properties
            if (currentLine.indexOf(symbols.begin_properties) === 0) {
                lineArray.splice(i,1); // be aware that this *mutates* the list
                i--;
                inPropertiesBlock = true;
            } else if (currentLine.indexOf(symbols.end_properties) === 0) {
                lineArray.splice(i,1);
                i--;
                inPropertiesBlock = false;
            } else if (inPropertiesBlock) {
                lineArray.splice(i,1);
                i--;
                propertiesString += currentLine;
            }
            // process editable lines and sections
              else if (currentLine.indexOf(symbols.begin_line) === 0) {
                lineArray.splice(i,1);
                i--;
                inEditableBlock = true;
            } else if (currentLine.indexOf(symbols.end_line) === 0) {
                lineArray.splice(i,1);
                i--;
                inEditableBlock = false;
            }
            // process start of startLevel()
              else if (currentLine.indexOf(symbols.start_start_level) === 0) {
                lineArray.splice(i,1);
                startOfStartLevel = i;
                i--;
            }
            // process end of startLevel()
              else if (currentLine.indexOf(symbols.end_start_level) === 0) {
                lineArray.splice(i,1);
                endOfStartLevel = i;
                i--;
            }
            // everything else
              else {
                if (inEditableBlock) {
                    editableLines.push(i);
                } else {
                    // check if there are any editable sections
                    var sections = [];
                    var startPoint = null;
                    for (var j = 0; j < currentLine.length - 2; j++) {
                        if (currentLine.slice(j,j+3) === symbols.begin_char) {
                            currentLine = currentLine.slice(0,j) + currentLine.slice(j+3, currentLine.length);
                            startPoint = j;
                        } else if (currentLine.slice(j,j+3) === symbols.end_char) {
                            currentLine = currentLine.slice(0,j) + currentLine.slice(j+3, currentLine.length);
                            sections.push([startPoint, j]);
                        }
                    }
                    if (sections.length > 0) {
                        lineArray[i] = currentLine;
                        editableSections[i] = sections;
                    }
                }
            }
        }

        try {
            properties = JSON.parse(propertiesString);
        } catch (e) {
            properties = {};
        }

        return lineArray.join("\n");
    }

    var findEndOfSegment = function(line) {
        // Given an editable line number, returns the last line of the
        // given line's editable segment.

        if (editableLines.indexOf(line + 1) === -1) {
            return line;
        }

        return findEndOfSegment(line + 1);
    };

    var shiftLinesBy = function(array, after, shiftAmount) {
        // Shifts all line numbers strictly after the given line by
        // the provided amount.

        return array.map(function(line) {
            if (line > after) {
                log('Shifting ' + line + ' to ' + (line + shiftAmount));
                return line + shiftAmount;
            }
            return line;
        });
    };

    // enforces editing restrictions when set as the handler
    // for the 'beforeChange' event
    var enforceRestrictions = function(instance, change) {
        lastChange = change;

        var inEditableArea = function(c) {
            var lineNum = c.to.line;
            if (editableLines.indexOf(lineNum) !== -1 && editableLines.indexOf(c.from.line) !== -1) {
                // editable lines?
                return true;
            } else if (editableSections[lineNum]) {
                // this line has editable sections - are we in one of them?
                var sections = editableSections[lineNum];
                for (var i = 0; i < sections.length; i++) {
                    var section = sections[i];
                    if (c.from.ch > section[0] && c.to.ch > section[0] &&
                        c.from.ch < section[1] && c.to.ch < section[1]) {
                        return true;
                    }
                }
                return false;
            }
        };

        log(
            '---Editor input (beforeChange) ---\n' +
            'Kind: ' + change.origin + '\n' +
            'Number of lines: ' + change.text.length + '\n' +
            'From line: ' + change.from.line + '\n' +
            'To line: ' + change.to.line
        );

        if (!inEditableArea(change)) {
            change.cancel();
        } else if (change.to.line < change.from.line ||
                   change.to.line - change.from.line + 1 > change.text.length) { // Deletion
            updateEditableLinesOnDeletion(change);
        } else { // Insert/paste
            // First line already editable
            var newLines = change.text.length - (change.to.line - change.from.line + 1);

            if (newLines > 0) {
                if (editableLines.indexOf(change.to.line) < 0) {
                    change.cancel();
                    return;
                }

                // enforce 80-char limit by wrapping all lines > 80 chars
                var wrappedText = [];
                change.text.forEach(function (line) {
                    while (line.length > charLimit) {
                        // wrap lines at spaces if at all possible
                        var minCutoff = charLimit - 20;
                        var cutoff = minCutoff + line.slice(minCutoff).indexOf(" ");
                        if (cutoff > 80) {
                            // no suitable cutoff point found - let's get messy
                            cutoff = 80;
                        }
                        wrappedText.push(line.substr(0, cutoff));
                        line = line.substr(cutoff);
                    }
                    wrappedText.push(line);
                });
                change.text = wrappedText;

                // updating line count
                newLines = change.text.length - (change.to.line - change.from.line + 1);

                updateEditableLinesOnInsert(change, newLines);
            } else {
                // enforce 80-char limit by trimming the line
                var lineLength = instance.getLine(change.to.line).length;
                if (lineLength + change.text[0].length > charLimit) {
                    var allowedLength = Math.max(charLimit - lineLength, 0);
                    change.text[0] = change.text[0].substr(0, allowedLength);
                }
            }

            // modify editable sections accordingly
            // TODO Probably broken by multiline paste
            var sections = editableSections[change.to.line];
            if (sections) {
                var delta = change.text[0].length - (change.to.ch - change.from.ch);
                for (var i = 0; i < sections.length; i++) {
                    // move any section start/end points that we are to the left of
                    if (change.to.ch < sections[i][1]) {
                        sections[i][1] += delta;
                    }
                    if (change.to.ch < sections[i][0]) {
                        sections[i][0] += delta;
                    }
                }
            }
        }

        log(editableLines);
    }

    var updateEditableLinesOnInsert = function(change, newLines) {
        var lastLine = findEndOfSegment(change.to.line);

        // Shift editable line numbers after this segment
        editableLines = shiftLinesBy(editableLines, lastLine, newLines);

        // TODO If editable sections appear together with editable lines
        // in a level, multiline edit does not properly handle editable
        // sections.

        log("Appending " + newLines + " lines");

        // Append new lines
        for (var i = lastLine + 1; i <= lastLine + newLines; i++) {
            editableLines.push(i);
        }

        // Update endOfStartLevel
        if (endOfStartLevel) {
            endOfStartLevel += newLines;
        }
    };

    var updateEditableLinesOnDeletion = function(changeInput) {
        // Figure out how many lines just got removed
        var numRemoved = changeInput.to.line - changeInput.from.line - changeInput.text.length + 1;
        // Find end of segment
        var editableSegmentEnd = findEndOfSegment(changeInput.to.line);
        // Remove that many lines from its end, one by one
        for (var i = editableSegmentEnd; i > editableSegmentEnd - numRemoved; i--) {
            log('Removing\t' + i);
            editableLines.remove(i);
        }
        // Shift lines that came after
        editableLines = shiftLinesBy(editableLines, editableSegmentEnd, -numRemoved);
        // TODO Shift editableSections

        // Update endOfStartLevel
        if (endOfStartLevel) {
            endOfStartLevel -= numRemoved;
        }
    };

    // beforeChange events don't pick up undo/redo
    // so we track them on change event
    var trackUndoRedo = function(instance, change) {
        if (change.origin === 'undo' || change.origin === 'redo') {
            enforceRestrictions(instance, change);
        }
    }

    this.initialize = function() {
        this.internalEditor = CodeMirror.fromTextArea(document.getElementById(textAreaDomID), {
            lineNumbers: true,
            dragDrop: false,
            smartIndent: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            mode: 'javascript'
        });

        this.internalEditor.setSize(width, height);

        this.internalEditor.on('cursorActivity', function (instance) {
            // fixes the cursor lag bug
            instance.refresh();
        });

        this.internalEditor.on('change', trackUndoRedo);
    }

    // returns all contents
    this.getCode = function (forSaving) {
        var lines = this.internalEditor.getValue().split('\n');

        return lines.join('\n');
    }

    this.getProperties = function () {
        return properties;
    }

    this.setCode = function(code) {
        // make sure we're not saving the hidden START/END_OF_START_LEVEL lines
        code = code.split('\n').filter(function (line) {
            return line.indexOf('OfStartLevelReached') < 0;
        }).join('\n');

        this.internalEditor.off('beforeChange',enforceRestrictions);
        this.internalEditor.setValue(code);
        this.internalEditor.on('beforeChange', enforceRestrictions);
        this.markUneditableLines();
        this.internalEditor.refresh();
        this.internalEditor.clearHistory();
    }

    this.createGist = function () {
        var lvlNum = game._currentLevel;
        var filename = 'untrusted-lvl' + lvlNum + '-solution.js';
        var description = 'Solution to level ' + lvlNum + ' in Untrusted: http://alex.nisnevich.com/untrusted/';
        var data = {
            'files': {},
            'description': description,
            'public': true
        };
        data['files'][filename] = {'content': this.getCode(true)};
        $.ajax({
            'url': 'https://api.github.com/gists',
            'type': 'POST',
            'data': JSON.stringify(data),
            'success': function (data, status, xhr) {
                $('#savedLevelMsg').html('Level ' + lvlNum + ' solution saved at <a href="'
                    + data['html_url'] + '" target="_blank">' + data['html_url'] + '</a>');
            }
        });
    }

    this.getGoodState = function (lvlNum) {
        return JSON.parse(localStorage.getItem('level' + lvlNum + '.lastGoodState'));
    }

    this.refresh = function () {
        this.internalEditor.refresh();
    }

    this.focus = function () {
        this.internalEditor.focus();
    }

    this.initialize(); // run initialization code
}
Game.prototype.verbotenWords = [
    '._', '"_', "'_", // prevents calling _unexposed methods
    '\\u005f', '\\x5', // equivalent to '_'
    'fromCharCode', // prevents String.fromCharCode(95) => "_"
    'eval', '.call', 'call(', 'apply', 'bind', // prevents arbitrary code execution
    'prototype', // prevents messing with prototypes
    'setTimeout', 'setInterval', // requires players to use map.startTimer() instead
    'requestAnimationFrame', 'mozRequestAnimationFrame', // (more timeout-like methods)
    'webkitRequestAnimationFrame', 'setImmediate', // (more timeout-like methods)
    'prompt', 'confirm', // prevents dialogs asking for user input
    'debugger', // prevents pausing execution
    'delete', // prevents removing items
    'atob(','btoa(',//prevent bypassing checks using Base64
    'Function(', //prevent constructing arbitrary function
    'constructor', // prevents retrieval of Function using an instance of it
    'window', // prevents setting "window.[...] = map", etc.
    'document', // in particular, document.write is dangerous
    'self.', 'self[', 'top.', 'top[', 'frames',  // self === top === frames === window
    'parent', 'content', // parent === content === window in most of cases
    'this[', // prevents this['win'+'dow'], etc.
    'alert', // prevents alertion
    '~' // prevents ~function(){}();
];
Game.prototype.allowedTime = 2000; // for infinite loop prevention

Game.prototype.validate = function (code) {
    privateScope = {};
    privateScope.game = this;

    try {
        for (var i = 0; i < this.verbotenWords.length; i++) {
            var badWord = this.verbotenWords[i];
            if (code.indexOf(badWord) > -1) {
                throw "You are not allowed to use '" + badWord + "'!";
            }
        }

        // modify the code to always check time to prevent infinite loops
        code = code.replace(/\)\s*{/g, ") {"); // converts Allman indentation -> K&R
        code = code.replace(/while\s*\((.*)\)/g, "for (dummy=0;$1;)"); // while -> for
        code = $.map(code.split('\n'), function (line, i) {
            return line.replace(/for\s*\((.*);(.*);(.*)\)\s*{/g,
                "for ($1, startTime = Date.now();$2;$3){" +
                    "if (Date.now() - startTime > " + privateScope.game.allowedTime + ") {" +
                        "throw '[Line " + (i+1) + "] TimeOutException: Maximum loop execution time of " + privateScope.game.allowedTime + " ms exceeded.';" +
                    "}");
        }).join('\n');

        code = privateScope.game._challenge.contestant.replace('/* action */', code);

        if (this._debugMode) {
            console.log(code);
        }

        var closuredEval = this._eval;

        return (function () {
            var privates = undefined;
            var privateScope = undefined;
            var window = undefined;
            var document = undefined;
            var alert = undefined;
            var fromCharCode = undefined;
            var atob = undefined;
            var btoa = undefined;
            var Function = undefined;
            var setTimeout = undefined;
            var setInterval = undefined;

            eval(code);

            return act;
        })();
    } catch (e) {
        var exceptionText = e.toString();
        if (e instanceof SyntaxError) {
            var lineNum = this.findSyntaxError(code, e.message);
            if (lineNum) {
                exceptionText = "[Line " + lineNum + "] " + exceptionText;
            }
        }
        this._log(exceptionText);
        throw e;

        return null;
    }
};

// awful awful awful method that tries to find the line
// of code where a given error occurs
Game.prototype.findSyntaxError = function(code, errorMsg) {
    var lines = code.split('\n');
    for (var i = 1; i <= lines.length; i++) {
        var testCode = lines.slice(0, i).join('\n');

        try {
            this._eval(testCode);
        } catch (e) {
            if (e.message === errorMsg) {
                return i;
            }
        }
    }
    return null;
};

Game.prototype.clearModifiedGlobals = function() {
    for (p in window) {
        if (window.propertyIsEnumerable(p) && this._globalVars.indexOf(p) == -1) {
            window[p] = null;
        }
    }
};

// Function tampering prevention

Game.prototype.referenceImplementations = {
    'map': {
        'countObjects': '',
        'createFromDOM': '',
        'createFromGrid': '',
        'displayChapter': '',
        'defineObject': '',
        'getAdjacentEmptyCells': '',
        'getCanvasContext': '',
        'getCanvasCoords': '',
        'getDOM': '',
        'getDynamicObjects': '',
        'getHeight': '',
        'getObjectTypeAt': '',
        'getPlayer': '',
        'getRandomColor': '',
        'getWidth': '',
        'isStartOfLevel': '',
        'overrideKey': '',
        'placeObject': '',
        'placePlayer': '',
        'setSquareColor': '',
        'startTimer': '',
        'updateDOM': '',
        'validateAtLeastXObjects': '',
        'validateAtMostXObjects': '',
        'validateExactlyXManyObjects': '',
        'validateAtMostXDynamicObjects': '',
        'validateNoTimers': '',
        'validateAtLeastXLines': ''
    },
    'player': {
        'atLocation': '',
        'getColor': '',
        'getX': '',
        'getY': '',
        'hasItem': '',
        'killedBy': '',
        'move': '',
        'removeItem': '',
        'setColor': '',
        'setPhoneCallback': ''
    }
}

Game.prototype.saveReferenceImplementations = function() {
    for (f in this.referenceImplementations.map) {
        if (this.referenceImplementations.map.hasOwnProperty(f)) {
            this.referenceImplementations.map[f] = this.map[f];
        }
    }

    var dummyPlayer = new Player(0, 0, this.map, this);
    for (f in this.referenceImplementations.player) {
        if (this.referenceImplementations.player.hasOwnProperty(f)) {
            this.referenceImplementations.player[f] = dummyPlayer[f];
        }
    }
};

Game.prototype.detectTampering = function(map, player) {
    // once the super menu is activated, we don't care anymore!
    if (this._superMenuActivated) {
        return;
    }

    for (f in this.referenceImplementations.map) {
        if (this.referenceImplementations.map.hasOwnProperty(f)) {
            if (this.referenceImplementations.map[f].toString() != map[f].toString()) {
                throw (f + '() has been tampered with!');
            }
        }
    }

    if (player) {
        for (f in this.referenceImplementations.player) {
            if (this.referenceImplementations.player.hasOwnProperty(f)) {
                if (this.referenceImplementations.player[f].toString() != player[f].toString()) {
                    throw (f + '() has been tampered with!');
                }
            }
        }
    }
};
$(document).ready(function() {
    privates.game = new Game(true, 'stone');
});

})();
