var Umpire = function (name) {
    var status = {
        stone: 100
    };

    this.playGame = function (contestantAction, rivalAction) {
        status.stone = randInt(10, 200);

        privates.game._log('Game started with ' + status.stone + ' stones.');

        var contestantsTurn = function (status) {
            try {
                var contestantsSelection = contestantAction(status);
                if (contestantsSelection !== 1 && contestantsSelection !== 2 && contestantsSelection !== 3) {
                    throw ('You can take only 1, 2, or 3 stones! You took: ' + contestantsSelection)
                }
            } catch (e) {
                privates.game._log(e.toString());
                gameSet(1);
                return;
            }

            if (status.stone - contestantsSelection > 0) {
                status.stone -= contestantsSelection;
                privates.game._log('You took ' + contestantsSelection + ' stones. ' + status.stone + ' remains...');
            } else {
                privates.game._log('You took ' + contestantsSelection + ' stones and took final stone!!');
                gameSet(1);
                return;
            }

            $('#screen').text(status.stone);

            if (privates.game.waitTime === 0) {
                rivalsTurn(status);
            } else {
                setTimeout(function () {
                    rivalsTurn(status);
                }, privates.game.waitTime);
            }
        };

        var rivalsTurn = function(status) {
            try {
                var rivalsSelection = rivalAction(status);
                if (rivalsSelection !== 1 && rivalsSelection !== 2 && rivalsSelection !== 3) {
                    throw ('Computer, you can take only 1, 2, or 3 stones! You took: ' + rivalsSelection)
                }
            } catch (e) {
                privates.game._log(e.toString());
                gameSet(0);
                return;
            }

            if (status.stone - rivalsSelection > 0) {
                status.stone -= rivalsSelection;
                privates.game._log('Computer took ' + rivalsSelection + ' stones. ' + status.stone + ' remains...');
            } else {
                privates.game._log('Computer took ' + rivalsSelection + ' stones and took final stone!!');
                gameSet(0);
                return;
            }

            $('#screen').text(status.stone);

            if (privates.game.waitTime === 0) {
                contestantsTurn(status);
            } else {
                setTimeout(function () {
                    contestantsTurn(status);
                }, privates.game.waitTime);
            }
        };

        var gameSet = function(winner) {
            if (winner == 0) {
                privates.game._log('You won!!');
            } else {
                privates.game._log('You lose...');
            }
        };

        contestantsTurn(status);
    };
};

var Rival = function (act) {
    this.act = act;
}

rivals = [];
rivals[0] = new Rival(function () {
    return 3;
});