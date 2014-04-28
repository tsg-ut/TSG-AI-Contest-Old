var Umpire = function (name) {
    var status = {
        stone: 100
    };

    $('#screen').text(status.stone);

    this.playGame = function () {
        status.stone -= 0;
    };
};

var Rival = function (act) {
    this.act = act;
}

rivals = [];
rivals[0] = new Rival(function () {
    return 3;
});