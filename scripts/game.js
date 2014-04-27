function Game(debugMode, challenge) {
    var game = this;

    this._challenge = {};
    this._challenge.name = challenge;

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
    };

    this._eval = window.eval; // store our own copy of eval so that we can override window.eval

    this.editor = new CodeEditor("editor", 400, 300, this);

    this._globalVars = []; // keep track of current global variables
    for (p in window) {
        if (window.propertyIsEnumerable(p)) {
            this._globalVars.push(p);
        }
    }

    if (debugMode) {
        this._debugMode = true;
    };

    // load challenge scripts
    /*$.ajax({
        url: 'challenges/' + game._challenge.name + '/umpire.js',
        dataType: 'script',
        success: function(){}
    }).done(function () {
        game.enableButtons();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        game._log(errorThrown);
        game._log('loading challenge failed.');
    });*/
    $.getScript('challenges/' + game._challenge.name + '/umpire.js', function () {

        alert("Script loaded and executed.");
        // Here you can use anything you defined in the loaded script
    });
}
