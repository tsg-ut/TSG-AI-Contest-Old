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

        game.waitTime = $('#waitTime').spinner('value') - 5;
        if (game.waitTime < 0) game.waitTime = 0;

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
