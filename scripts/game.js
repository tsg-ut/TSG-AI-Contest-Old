function Game(debugMode, challenge) {
    var __currentCode = '';
    var __commands = [];

    var _challenge = 'stone';

    this._eval = window.eval; // store our own copy of eval so that we can override window.eval

    this.editor = new CodeEditor("editor", 400, 300, this);

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
    };

    this._loadScript = function (scriptName) {
        return $.ajax({
            url: scriptName,
            dataType: 'script'
        });
    }

    this._execute = function () {
        var code = this.editor.getCode();

        var validatedAct = this.validate(code);

        if (validatedAct) {
            validatedAct(100);
        }
    };

    this._log = function (text) {
        $('#log').append(text);
        $('#log').append('\n');
        console.log(text);
    }
}
