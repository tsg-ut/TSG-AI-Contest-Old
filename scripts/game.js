function Game(debugMode, startLevel) {
    /* private properties */

    var __currentCode = '';
    var __commands = [];

    /* unexposed properties */

    this._eval = window.eval; // store our own copy of eval so that we can override window.eval

    /* unexposed methods */

    this._initialize = function () {
        $('#screen').text('100');

        // Initialize map and editor
        this.editor = new CodeEditor("editor", 600, 300, this);

        this.enableButtons();

        this._globalVars = []; // keep track of current global variables
        for (p in window) {
            if (window.propertyIsEnumerable(p)) {
                this._globalVars.push(p);
            }
        }

        // Enable debug features
        if (debugMode) {
            this._debugMode = true;
        }
    };

    this._evalCode = function () {
        var game = this;

        code = this.editor.getCode();
        loadedFromEditor = true;

        // validate the code
        // if it passes validation, returns the startLevel function if it pass
        // if it fails validation, returns false
        var validatedTurn = this.validate(code);

        if (validatedTurn) { // code is valid
            // start the level
            validatedTurn(100);
        }
    };

    this._log = function (text) {
        $('#log').append(text);
        $('#log').append('\n');
        console.log(text);
    }
}
