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
