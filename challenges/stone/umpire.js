var Umpire = function (name) {
    var _status = {
        stone: 100
    };

    this.playGame = function (contestantAction, rivalAction) {
        _status.stone = randInt(1000, 2000);

        _status.stone -= 0;
    };
};

var Rival = function (act) {
    this.act = act;
}

rivals = [];
rivals[0] = new Rival(function () {
    return 3;
});